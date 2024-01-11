import {
  coin,
  coins,
  decodePubkey,
  decodeTxRaw,
  DirectSecp256k1HdWallet,
} from "@cosmjs/proto-signing";
import { createMultisigThresholdPubkey, pubkeyToAddress } from "@cosmjs/amino";
import {
  AminoTypes,
  SigningStargateClient,
  StargateClient,
  createIbcAminoConverters,
  makeMultisignedTx,
} from "@cosmjs/stargate";
import { MsgTransfer } from "cosmjs-types/ibc/applications/transfer/v1/tx";
import Long from "long";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { toBase64, fromBase64 } from "@cosmjs/encoding";
import { TxRaw, AuthInfo } from "cosmjs-types/cosmos/tx/v1beta1/tx";

const SOURCE_RPC = "https://rpc.mainnet.archway.io:443";
const EXTERNAL_RPC = "https://rpc.qwoyn.studio:443";
const EXTERNAL_NATIVE_DENOM = "uqwoyn";
const SOURCE_IBC_TRANSFER_CHANNEL_ID = "channel-88";
const EXTERNAL_IBC_TRANSFER_CHANNEL_ID = "channel-5";
const EXTERNAL_PREFIX = "qwoyn";
const EXTERNAL_CHAIN_ID = "qwoyn-1";

(async () => {
  const testArchAddr = "archway1wphe5drvyuj8mav7sm6ylr9e6npalt7u6eef6p";
  const testAddr1 = "qwoyn1wphe5drvyuj8mav7sm6ylr9e6npalt7ujjynhh";
  const testMnemonic1 =
    "scan shoulder scan offer hen wild submit lazy celery run clutch use purity ramp spy forum visa inquiry side reduce circle speed ride film";

  const testAddr2 = "qwoyn1k4ehlph6jqwvs2z5qv9ulm38fa9pndd0rz6tq8";
  const testMnemonic2 =
    "grow make spoon garage vibrant equip digital recipe velvet dinner fever wage room soft service crazy popular off matrix clap will error sword tunnel";

  const multisig = createMultisigThresholdPubkey(
    [
      {
        type: "tendermint/PubKeySecp256k1",
        value: "AkiB4F20I9ynbvPbY/rWspcquE9ALfm9891w+j8Ncnsj",
      },
      {
        type: "tendermint/PubKeySecp256k1",
        value: "A9BpBb/xAKiZGWCl3Gro9Gl3yLcZjVBRkeH6E81QQ6Hw",
      },
    ],
    2
  );

  const testAddr = pubkeyToAddress(multisig, "qwoyn");

  const msgTransfer: MsgTransfer = {
    sourcePort: "transfer",
    sourceChannel: EXTERNAL_IBC_TRANSFER_CHANNEL_ID!,
    token: coin("100", EXTERNAL_NATIVE_DENOM!),
    sender: testAddr,
    receiver: testArchAddr,
    timeoutTimestamp: BigInt("1704888021617000000"),
    timeoutHeight: {
      revisionNumber: BigInt(0),
      revisionHeight: BigInt(0),
    },
    memo: "",
  };

  const msg2 = {
    typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
    value: msgTransfer,
  };

  const fee2 = {
    amount: coins(10000, EXTERNAL_NATIVE_DENOM!),
    gas: "250000",
  };

  const walletRewardsExternal = await DirectSecp256k1HdWallet.fromMnemonic(
    testMnemonic1,
    {
      prefix: EXTERNAL_PREFIX,
    }
  );

  let signerClientRewardsExternal = await SigningStargateClient.offline(
    walletRewardsExternal
  );
  signerClientRewardsExternal.registry.register(
    "/ibc.applications.transfer.v1.MsgTransfer",
    MsgTransfer
  );

  const clientRewardsExternal = await CosmWasmClient.connect(EXTERNAL_RPC!);

  const multisigAccRewardsExternal = await clientRewardsExternal.getAccount(
    testAddr
  );

  const txRaw1 = await signerClientRewardsExternal.sign(
    testAddr1,
    [msg2],
    fee2,
    "",
    {
      accountNumber: multisigAccRewardsExternal!.accountNumber,
      sequence: multisigAccRewardsExternal!.sequence,
      chainId: EXTERNAL_CHAIN_ID!,
    }
  );

  const txBody = toBase64(txRaw1.bodyBytes);
  const signature = toBase64(txRaw1.signatures[0]);

  ////////////////

  const walletRewardsExternal2 = await DirectSecp256k1HdWallet.fromMnemonic(
    testMnemonic2,
    {
      prefix: EXTERNAL_PREFIX,
    }
  );

  let signerClientRewardsExternal2 = await SigningStargateClient.offline(
    walletRewardsExternal2,
    {
      //prefix: EXTERNAL_PREFIX!,
      //   aminoTypes: new AminoTypes({
      //     ...createIbcAminoConverters(),
      //   }),
    }
  );
  signerClientRewardsExternal2.registry.register(
    "/ibc.applications.transfer.v1.MsgTransfer",
    MsgTransfer
  );

  const clientRewardsExternal2 = await CosmWasmClient.connect(EXTERNAL_RPC!);

  const multisigAccRewardsExternal2 = await clientRewardsExternal2.getAccount(
    testAddr
  );

  const txRaw2 = await signerClientRewardsExternal2.sign(
    testAddr2,
    [msg2],
    fee2,
    "",
    {
      accountNumber: multisigAccRewardsExternal2!.accountNumber,
      sequence: multisigAccRewardsExternal2!.sequence,
      chainId: EXTERNAL_CHAIN_ID!,
    }
  );

  /////////////////////////

  const signerInfos = [
    AuthInfo.decode(txRaw1.authInfoBytes).signerInfos[0],
    AuthInfo.decode(txRaw2.authInfoBytes).signerInfos[0],
  ];
  let authInfoMultisig = { ...AuthInfo.decode(txRaw1.authInfoBytes) };
  authInfoMultisig.signerInfos = signerInfos;

  console.log(multisigAccRewardsExternal2);

  clientRewardsExternal2;
  const signedTx = makeMultisignedTx(
    multisig,
    multisigAccRewardsExternal2!.sequence,
    fee2,
    txRaw1.bodyBytes,
    new Map<string, Uint8Array>([
      [testAddr1, txRaw1.signatures[0]],
      [testAddr2, txRaw2.signatures[0]],
    ])
  );

  const externalClient = await StargateClient.connect(EXTERNAL_RPC!);
  const result = await externalClient.broadcastTx(
    Uint8Array.from(TxRaw.encode(signedTx).finish()),
    300000 // 5 min of timeout
  );

  console.log(result);
})();
