# Merkle Double Witness for O1js

This repository contains the source code of an [o1js](https://docs.minaprotocol.com/zkapps/o1js) compatible Merkle Double Witness implementation.

It contains a provable `MerkleDoubleWitness` equivalent for `MerkleWitness` to use with two different leaves' witnesses, which enables updating two different leaves' values at the same time and having a new updated Merkle root.

> [o1js](https://docs.minaprotocol.com/zkapps/o1js) is a TypeScript library for writing general-purpose zk programs and zk smart contracts for [Mina Protocol](https://minaprotocol.com/).

## Usage

```ts
class MyMerkleDoubleWitness extends MerkleDoubleWitness(8) {}

const merkleTree = new MerkleTree(8);

const doubleWitness = new MyMerkleDoubleWitness(
  merkleTree.getWitness(11n),
  merkleTree.getWitness(22n)
);

const root = doubleWitness.calculateRoot(Field.from(0), Field.from(0));

const [firstIndex, secondIndex] = doubleWitness.calculateIndexes();
```

## Install Dependencies

```shell
$ npm install
```

## Run Tests

```shell
$ npm test
```

## Note

The project is developed by [Berzan](https://berzan.org) with his love, sweat, and tears.
