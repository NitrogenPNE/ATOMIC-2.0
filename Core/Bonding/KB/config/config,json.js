{
    "port": 4020,
        "logging": {
        "enabled": true,
            "level": "info",
                "destination": "../../logs/MB/mbBondingNode.log"
    },
    "ledgers": {
        "kb": {
            "proton": "../../../Ledgers/Frequencies/KB/protonBounceRate.json",
                "electron": "../../../Ledgers/Frequencies/KB/electronBounceRate.json",
                    "neutron": "../../../Ledgers/Frequencies/KB/neutronBounceRate.json"
        },
        "mb": "../../../Ledgers/Frequencies/MB/"
    },
    "bondingThreshold": 1024
}
