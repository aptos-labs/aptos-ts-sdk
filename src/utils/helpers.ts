// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

export async function sleep(timeMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}
