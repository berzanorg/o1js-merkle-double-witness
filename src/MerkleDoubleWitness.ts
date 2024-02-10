import { Bool, CircuitValue, Field, Poseidon, Provable, arrayProp } from "o1js";

type Witness = Array<{
    isLeft: boolean;
    sibling: Field;
}>;

export { MerkleDoubleWitness };

class BaseMerkleDoubleWitness extends CircuitValue {
    static height: number;
    pathOfFirst: Field[];
    pathOfSecond: Field[];
    isLeftOfFirst: Bool[];
    isLeftOfSecond: Bool[];
    height(): number {
        return (this.constructor as any).height;
    }

    /**
     * Takes a {@link Witness} and turns it into a circuit-compatible Witness.
     * @param witnessOfFirst Witness.
     * @returns A circuit-compatible Witness.
     */
    constructor(witnessOfFirst: Witness, witnessOfSecond: Witness) {
        super();
        const heightOfFirst = witnessOfFirst.length + 1;
        const heightOfSecond = witnessOfSecond.length + 1;
        if (heightOfFirst !== this.height()) {
            throw Error(`Length of first witness ${heightOfFirst}-1 doesn't match static tree height ${this.height()}.`);
        }
        if (heightOfSecond !== this.height()) {
            throw Error(`Length of second witness ${heightOfSecond}-1 doesn't match static tree height ${this.height()}.`);
        }
        this.pathOfFirst = witnessOfFirst.map((item) => item.sibling);
        this.isLeftOfFirst = witnessOfFirst.map((item) => Bool(item.isLeft));
        this.pathOfSecond = witnessOfSecond.map((item) => item.sibling);
        this.isLeftOfSecond = witnessOfSecond.map((item) => Bool(item.isLeft));
    }

    /**
     * Calculates a root depending on the leaf values.
     * @param leafOfFirst Value of the first leaf node that belongs to this Double Witness.
     * @param leafOfFirst Value of the second leaf node that belongs to this Double Witness.
     * @returns The calculated root.
     */
    calculateRoot(leafOfFirst: Field, leafOfSecond: Field): Field {
        let hash = Field(0);
        let hashOfFirst = leafOfFirst;
        let hashOfSecond = leafOfSecond;
        const n = this.height();

        let isDifferentIndex = Field(n - 1);

        for (let i = 1; i < n; ++i) {
            const j = n - i - 1;

            const isDifferent = this.isLeftOfFirst[j].equals(this.isLeftOfSecond[j]).and(this.pathOfFirst[j].equals(this.pathOfSecond[j])).not();

            isDifferentIndex = Provable.if(isDifferent.and(isDifferentIndex.equals(n - 1)), Field(j), isDifferentIndex);
        }

        for (let i = 1; i < n; ++i) {
            const [leftX, rightX] = maybeSwap(this.isLeftOfFirst[i - 1], hashOfFirst, hashOfSecond);
            hash = Provable.if(isDifferentIndex.equals(i - 1), Poseidon.hash([leftX, rightX]), hash);

            const [leftY, rightY] = maybeSwap(this.isLeftOfFirst[i - 1], hash, this.pathOfFirst[i - 1]);
            hash = Provable.if(isDifferentIndex.lessThan(i - 1), Poseidon.hash([leftY, rightY]), hash);

            const [leftOfFirst, rightOfFirst] = maybeSwap(this.isLeftOfFirst[i - 1], hashOfFirst, this.pathOfFirst[i - 1]);
            const [leftOfSecond, rightOfSecond] = maybeSwap(this.isLeftOfSecond[i - 1], hashOfSecond, this.pathOfSecond[i - 1]);
            hashOfFirst = Poseidon.hash([leftOfFirst, rightOfFirst]);
            hashOfSecond = Poseidon.hash([leftOfSecond, rightOfSecond]);
        }

        return hash;
    }

    /**
     * Calculates the indexes of the leaf nodes that belong to this Double Witness.
     * @returns Indexes of the leaves.
     */
    calculateIndexes(): [Field, Field] {
        let powerOfTwo = Field(1);
        let indexOfFirst = Field(0);
        let indexOfSecond = Field(0);
        const n = this.height();

        for (let i = 1; i < n; ++i) {
            indexOfFirst = Provable.if(this.isLeftOfFirst[i - 1], indexOfFirst, indexOfFirst.add(powerOfTwo));
            indexOfSecond = Provable.if(this.isLeftOfSecond[i - 1], indexOfSecond, indexOfSecond.add(powerOfTwo));
            powerOfTwo = powerOfTwo.mul(2);
        }

        return [indexOfFirst, indexOfSecond];
    }
}

/**
 * Returns a circuit-compatible Double Witness for a specific Tree height.
 * @param height Height of the Merkle Tree that this Double Witness belongs to.
 * @returns A circuit-compatible Merkle Double Witness.
 */
function MerkleDoubleWitness(height: number): typeof BaseMerkleDoubleWitness {
    class MerkleWitness_ extends BaseMerkleDoubleWitness {
        static height = height;
    }
    arrayProp(Field, height - 1)(MerkleWitness_.prototype, "pathOfFirst");
    arrayProp(Field, height - 1)(MerkleWitness_.prototype, "pathOfSecond");
    arrayProp(Bool, height - 1)(MerkleWitness_.prototype, "isLeftOfFirst");
    arrayProp(Bool, height - 1)(MerkleWitness_.prototype, "isLeftOfSecond");
    return MerkleWitness_;
}

function maybeSwap(b: Bool, x: Field, y: Field): [Field, Field] {
    const m = b.toField().mul(x.sub(y)); // b*(x - y)
    const x_ = y.add(m); // y + b*(x - y)
    const y_ = x.sub(m); // x - b*(x - y) = x + b*(y - x)
    return [x_, y_];
}
