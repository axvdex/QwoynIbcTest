# Test multisig offline signing and then broadcast of a IBC transfer transaction on Qwoyn chain

This repo contains a simple node script that composes a multisig wallet, where each signer signs the transaction offline, and then the transaction is broadcasted to the chain from the multisig wallet.
This is specific for QWOYN chain.

To run:

```
yarn
yarn start
```

## Purpose

Executing this on QWOYN chain should result in the transaction executing successfuly but as of now it fails with the following error:

```
BroadcastTxError: Broadcasting transaction failed with code 111222 (codespace: undefined). Log: recovered: expected *legacytx.LegacyMsg when using amino JSON
```
