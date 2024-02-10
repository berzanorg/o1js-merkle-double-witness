import { it, describe } from "node:test";
import assert from "node:assert";
import { Field, MerkleTree, SmartContract, method } from "o1js";

import { MerkleDoubleWitness } from "./MerkleDoubleWitness.js";

describe("MerkleDoubleWitness", async () => {
    const height = 6;

    class MyMerkleDoubleWitness extends MerkleDoubleWitness(height) {}

    it("is provable", async () => {
        class TestContract extends SmartContract {
            @method test(doubleWitness: MyMerkleDoubleWitness) {
                doubleWitness.calculateIndexes()[0];
                doubleWitness.calculateRoot(Field(1), Field(1));
            }
        }

        await TestContract.compile();
    });

    it("calculates indexes of empty tree", () => {
        const merkleTree = new MerkleTree(height);

        for (let i = 1; i < 2 ** (height - 1); i++) {
            const doubleWitness = new MyMerkleDoubleWitness(merkleTree.getWitness(0n), merkleTree.getWitness(BigInt(i)));

            assert.deepEqual([Field.from(0), Field.from(i)], doubleWitness.calculateIndexes());
        }
    });

    it("calculates indexes of filled tree", () => {
        const merkleTree = new MerkleTree(height);

        Array(32)
            .fill(0)
            .forEach((v, i) => merkleTree.setLeaf(BigInt(i), Field(i)));

        for (let i = 1; i < 2 ** (height - 1); i++) {
            const doubleWitness = new MyMerkleDoubleWitness(merkleTree.getWitness(0n), merkleTree.getWitness(BigInt(i)));

            assert.deepEqual([Field.from(0), Field.from(i)], doubleWitness.calculateIndexes());
        }
    });

    it("calculates root of empty tree", () => {
        const merkleTree = new MerkleTree(height);

        const root = merkleTree.getRoot();

        for (let i = 1; i < 2 ** (height - 1); i++) {
            const doubleWitness = new MyMerkleDoubleWitness(merkleTree.getWitness(0n), merkleTree.getWitness(BigInt(i)));

            assert.deepEqual(root, doubleWitness.calculateRoot(Field.from(0), Field.from(0)), `leaf ${i}'s calculated root is not valid`);
        }
    });

    it("calculates root of filled tree", () => {
        const merkleTree = new MerkleTree(height);

        Array(32)
            .fill(0)
            .forEach((v, i) => merkleTree.setLeaf(BigInt(i), Field(i)));

        const root = merkleTree.getRoot();

        for (let i = 1; i < 2 ** (height - 1); i++) {
            const doubleWitness = new MyMerkleDoubleWitness(merkleTree.getWitness(0n), merkleTree.getWitness(BigInt(i)));

            assert.deepEqual(root, doubleWitness.calculateRoot(Field.from(0), Field.from(i)), `leaf ${i}'s calculated root is not valid`);
        }
    });
});
