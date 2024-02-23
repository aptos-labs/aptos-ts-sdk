// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */

import { ValidatorTransactionResponse, TransactionResponseType, BlockMetadataTransactionResponse } from "../../../src";

describe("transaction response types", () => {
  test("it tests a sample validator_transaction JSON response satisfies ValidatorTransactionResponse", async () => {
    const txn = {
      version: "3",
      hash: "0xc2f1a301b4af32c817f624f7b6edb778c5ec522e1e122b1b0d74472a10809cef",
      state_change_hash: "0xf8699a3b0194c10eb0242fdeb9361deee8a3c242a21222e74df857c3c0ac1961",
      event_root_hash: "0x0db7799c6ee25bc8ca2539ba4fb04f1c701c9bc929c97c54e7a12d584ade84a1",
      state_checkpoint_hash: null,
      gas_used: "0",
      success: true,
      vm_status: "Executed successfully",
      accumulator_root_hash: "0xec3a5fa8a61310432a89b23549cea590a44e79afe9d232d241efb23a6f18592f",
      changes: [
        {
          address: "0x1",
          state_key_hash: "0x50578ada6e87f43cf8693b904e291f9a4b45e3dd8ba76fd7a5b6cfe2b04db116",
          data: {
            type: "0x1::jwks::PatchedJWKs",
            data: {
              jwks: {
                entries: [
                  {
                    issuer: "0x68747470733a2f2f6163636f756e74732e676f6f676c652e636f6d",
                    jwks: [
                      {
                        variant: {
                          data: "0x2835356331383861383335343666633138386535313537366261373238333665303630306538623733035253410552533235360441514142d60271304372463378336159736a7230594f4c4d4f416845474d76794670366f34527179456455726e5444596b685a626375642d664a4551616643546e6a533951484e31496a70754b366770783569332d5a363376526a7335455158376c50316a473851672d436e426454544c7734754a6937526d6d6c4b507359614f3144624e6b464f3275454e3632734f4f7a6d4a4368316f6433435a5849315559483563765a5f734c4a614e3241345477765554553361586c5862554e4a7a5f4879336c3071314a6a746137354e724a744a3750666a3974565873387158703135745a58726e62614d2d41493070757377743335567351626d4c77556f7646464765546f6f357132635f633178596e56357551594d6164414e656b47505246504d394a5a705353497648304c765f66313556327a52716d49675837613352636d546e72332d7733514e51546f6764792d4d6f67785055645262786f77",
                          type_name: "0x1::jwks::RSA_JWK",
                        },
                      },
                      {
                        variant: {
                          data: "0x2865643830366631383432623538383035346231386236363964643161303961346633363761666334035253410552533235360441514142d60272483351354e59364d41656145384e75537737527732436331655f6a2d6b555330343474752d57636d54467a424b54754b76496c676a357730536c536269566c38317a4274657451467475776b4d7a57676e436b732d322d4677706f795f5f324e556f7555674c74496767415645794f4767504c6679617377746b536d5a73556d575767394a3843674d55646f58466b625a41506c616444636d537169584a376370396e76726f366634736a66724744597a355f2d534e7a314151454762766354683945655a6b764b50726d6e56335945523935624a73676b486d4e4a566b51364c6357744c794b6853475147524d655459615844616a63324b724b54336e657437714e6862416d374b70576464627452356c36413054524372414d6f56324d36385f474c5246323461636a33554f35525730536b756142545a53344b5170796f7941424341746a4c53722d335259365752396e7077",
                          type_name: "0x1::jwks::RSA_JWK",
                        },
                      },
                    ],
                    version: "1",
                  },
                ],
              },
            },
          },
          type: "write_resource",
        },
        {
          address: "0x1",
          state_key_hash: "0x5c4285a5bcbfb079714ca24ba9c766305b3d1ae093da3bce6c5c32aaa7f6cac0",
          data: {
            type: "0x1::jwks::ObservedJWKs",
            data: {
              jwks: {
                entries: [
                  {
                    issuer: "0x68747470733a2f2f6163636f756e74732e676f6f676c652e636f6d",
                    jwks: [
                      {
                        variant: {
                          data: "0x2835356331383861383335343666633138386535313537366261373238333665303630306538623733035253410552533235360441514142d60271304372463378336159736a7230594f4c4d4f416845474d76794670366f34527179456455726e5444596b685a626375642d664a4551616643546e6a533951484e31496a70754b366770783569332d5a363376526a7335455158376c50316a473851672d436e426454544c7734754a6937526d6d6c4b507359614f3144624e6b464f3275454e3632734f4f7a6d4a4368316f6433435a5849315559483563765a5f734c4a614e3241345477765554553361586c5862554e4a7a5f4879336c3071314a6a746137354e724a744a3750666a3974565873387158703135745a58726e62614d2d41493070757377743335567351626d4c77556f7646464765546f6f357132635f633178596e56357551594d6164414e656b47505246504d394a5a705353497648304c765f66313556327a52716d49675837613352636d546e72332d7733514e51546f6764792d4d6f67785055645262786f77",
                          type_name: "0x1::jwks::RSA_JWK",
                        },
                      },
                      {
                        variant: {
                          data: "0x2865643830366631383432623538383035346231386236363964643161303961346633363761666334035253410552533235360441514142d60272483351354e59364d41656145384e75537737527732436331655f6a2d6b555330343474752d57636d54467a424b54754b76496c676a357730536c536269566c38317a4274657451467475776b4d7a57676e436b732d322d4677706f795f5f324e556f7555674c74496767415645794f4767504c6679617377746b536d5a73556d575767394a3843674d55646f58466b625a41506c616444636d537169584a376370396e76726f366634736a66724744597a355f2d534e7a314151454762766354683945655a6b764b50726d6e56335945523935624a73676b486d4e4a566b51364c6357744c794b6853475147524d655459615844616a63324b724b54336e657437714e6862416d374b70576464627452356c36413054524372414d6f56324d36385f474c5246323461636a33554f35525730536b756142545a53344b5170796f7941424341746a4c53722d335259365752396e7077",
                          type_name: "0x1::jwks::RSA_JWK",
                        },
                      },
                    ],
                    version: "1",
                  },
                ],
              },
            },
          },
          type: "write_resource",
        },
      ],
      events: [
        {
          guid: {
            creation_number: "0",
            account_address: "0x0",
          },
          sequence_number: "0",
          type: "0x1::jwks::ObservedJWKsUpdated",
          data: {
            epoch: "2",
            jwks: {
              entries: [
                {
                  issuer: "0x68747470733a2f2f6163636f756e74732e676f6f676c652e636f6d",
                  jwks: [
                    {
                      variant: {
                        data: "0x2835356331383861383335343666633138386535313537366261373238333665303630306538623733035253410552533235360441514142d60271304372463378336159736a7230594f4c4d4f416845474d76794670366f34527179456455726e5444596b685a626375642d664a4551616643546e6a533951484e31496a70754b366770783569332d5a363376526a7335455158376c50316a473851672d436e426454544c7734754a6937526d6d6c4b507359614f3144624e6b464f3275454e3632734f4f7a6d4a4368316f6433435a5849315559483563765a5f734c4a614e3241345477765554553361586c5862554e4a7a5f4879336c3071314a6a746137354e724a744a3750666a3974565873387158703135745a58726e62614d2d41493070757377743335567351626d4c77556f7646464765546f6f357132635f633178596e56357551594d6164414e656b47505246504d394a5a705353497648304c765f66313556327a52716d49675837613352636d546e72332d7733514e51546f6764792d4d6f67785055645262786f77",
                        type_name: "0x1::jwks::RSA_JWK",
                      },
                    },
                    {
                      variant: {
                        data: "0x2865643830366631383432623538383035346231386236363964643161303961346633363761666334035253410552533235360441514142d60272483351354e59364d41656145384e75537737527732436331655f6a2d6b555330343474752d57636d54467a424b54754b76496c676a357730536c536269566c38317a4274657451467475776b4d7a57676e436b732d322d4677706f795f5f324e556f7555674c74496767415645794f4767504c6679617377746b536d5a73556d575767394a3843674d55646f58466b625a41506c616444636d537169584a376370396e76726f366634736a66724744597a355f2d534e7a314151454762766354683945655a6b764b50726d6e56335945523935624a73676b486d4e4a566b51364c6357744c794b6853475147524d655459615844616a63324b724b54336e657437714e6862416d374b70576464627452356c36413054524372414d6f56324d36385f474c5246323461636a33554f35525730536b756142545a53344b5170796f7941424341746a4c53722d335259365752396e7077",
                        type_name: "0x1::jwks::RSA_JWK",
                      },
                    },
                  ],
                  version: "1",
                },
              ],
            },
          },
        },
      ],
      timestamp: "1708575651139233",
      type: TransactionResponseType.Validator,
    } satisfies ValidatorTransactionResponse;
  });

  test("it tests a sample block_metadata JSON response satisfies BlockMetadataTransactionResponse", async () => {
    const txn = {
      version: "2",
      hash: "0x55ac208f0e48f428f210125fcb7c21507f2ea3077a6526824d10a2511a9da188",
      state_change_hash: "0xb1aedbb0e61726f11bde3d5c6a44173659c288071e8deb4536ab61c7905b98b6",
      event_root_hash: "0xf90ec7849cd77a2ecd43dbca81b2ab5a20bd21adcbd6d655c69dca386c3d85f6",
      state_checkpoint_hash: null,
      gas_used: "0",
      success: true,
      vm_status: "Executed successfully",
      accumulator_root_hash: "0x4fff1c6b391b11c08aac65bf9162ca9889140fde0dc350915757382cd514f8a6",
      changes: [
        {
          address: "0x1",
          state_key_hash: "0x5ddf404c60e96e9485beafcabb95609fed8e38e941a725cae4dcec8296fb32d7",
          data: {
            type: "0x1::block::BlockResource",
            data: {
              epoch_interval: "60000000",
              height: "2",
              new_block_events: {
                counter: "3",
                guid: {
                  id: {
                    addr: "0x1",
                    creation_num: "3",
                  },
                },
              },
              update_epoch_interval_events: {
                counter: "0",
                guid: {
                  id: {
                    addr: "0x1",
                    creation_num: "4",
                  },
                },
              },
            },
          },
          type: "write_resource",
        },
        {
          address: "0x1",
          state_key_hash: "0x8048c954221814b04533a9f0a9946c3a8d472ac62df5accb9f47c097e256e8b6",
          data: {
            type: "0x1::stake::ValidatorPerformance",
            data: {
              validators: [
                {
                  failed_proposals: "0",
                  successful_proposals: "1",
                },
              ],
            },
          },
          type: "write_resource",
        },
        {
          address: "0x1",
          state_key_hash: "0x7b1615bf012d3c94223f3f76287ee2f7bdf31d364071128b256aeff0841b626d",
          data: {
            type: "0x1::timestamp::CurrentTimeMicroseconds",
            data: {
              microseconds: "1708575651139233",
            },
          },
          type: "write_resource",
        },
        {
          address: "0x1",
          state_key_hash: "0xacb6a6ca3f454dc5ce4feee8644807c3083559c23b442c4edaa47cfc3e2f8929",
          data: {
            type: "0x1::state_storage::StateStorageUsage",
            data: {
              epoch: "2",
              usage: {
                bytes: "698048",
                items: "161",
              },
            },
          },
          type: "write_resource",
        },
      ],
      id: "0x98236644cc6d0169d58492db6eac038fe21bdefe6909e06494753710615e173a",
      epoch: "2",
      round: "1",
      events: [
        {
          guid: {
            creation_number: "3",
            account_address: "0x1",
          },
          sequence_number: "2",
          type: "0x1::block::NewBlockEvent",
          data: {
            epoch: "2",
            failed_proposer_indices: [],
            hash: "0x98236644cc6d0169d58492db6eac038fe21bdefe6909e06494753710615e173a",
            height: "2",
            previous_block_votes_bitvec: "0x00",
            proposer: "0xfc1b1b4ed23ac63a5a80121590343578ce704901028322e827b254cc8e404558",
            round: "1",
            time_microseconds: "1708575651139233",
          },
        },
      ],
      previous_block_votes_bitvec: [0],
      proposer: "0xfc1b1b4ed23ac63a5a80121590343578ce704901028322e827b254cc8e404558",
      failed_proposer_indices: [],
      timestamp: "1708575651139233",
      type: TransactionResponseType.BlockMetadata,
    } satisfies BlockMetadataTransactionResponse;
  });
});
