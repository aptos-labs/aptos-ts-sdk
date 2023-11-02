// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../../../api";
import { Network } from "../../../utils/apiEndpoints";

function getConfigOrNetwork(aptosConfigOrNetwork: AptosConfig | Network): AptosConfig {
    if (aptosConfigOrNetwork instanceof AptosConfig) {
        return aptosConfigOrNetwork;
    }
    return new AptosConfig({ network: aptosConfigOrNetwork });
}
