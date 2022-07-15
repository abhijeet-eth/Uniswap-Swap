import React, { useState, useEffect, useCallback } from 'react';
import Swap from './Swap.json';
import { ethers } from "ethers";
import './App.css';

function App() {
    let contractAddress = "0x7623e1290ED3ebf64bf80004EF5cce3A227e98Ec";

    let [blockchainProvider, setBlockchainProvider] = useState(undefined);
    let [metamask, setMetamask] = useState(undefined);
    let [metamaskNetwork, setMetamaskNetwork] = useState(undefined);
    let [metamaskSigner, setMetamaskSigner] = useState(undefined);
    const [networkId, setNetworkId] = useState(undefined);
    const [loggedInAccount, setAccounts] = useState(undefined);
    const [etherBalance, setEtherBalance] = useState(undefined);
    const [isError, setError] = useState(false);

    const [contract, setReadContract] = useState(null);
    const [writeContract, setWriteContract] = useState(null);

    const [output, setOutput] = useState(null);
    const [tokenInput, setTokenInput] = useState(null);
    const [tokenInput2, setTokenInput2] = useState(null);
    const [amountInput, setAmountInput] = useState(null);
    const [amountInput2, setAmountInput2] = useState(null);
    const [amountInput3, setAmountInput3] = useState(null);
    const [userETHBalance, setUserETHBalance] = useState(0);
    const [contractETHBalance, setContractETHBalance] = useState(0);

    let alertMessage;

    const connect = async () => {

        //############################################################################################//
        //############################### Metamask Integration ###################################//
        //############################################################################################//    

        try {
            let provider, network, metamaskProvider, signer, accounts;

            if (typeof window.ethereum !== 'undefined') {
                // Connect to RPC  
                console.log('loadNetwork')
                try {

                    //console.log("acc", acc); 
                    //window.ethereum.enable();
                    //await handleAccountsChanged();
                    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    await handleAccountsChanged(accounts);
                } catch (err) {
                    if (err.code === 4001) {
                        // EIP-1193 userRejectedRequest error
                        // If this happens, the user rejected the connection request.
                        console.log('Please connect to MetaMask.');
                    } else {
                        console.error(err);
                    }
                }
                provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/c811f30d8ce746e5a9f6eb173940e98a`)
                //const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")
                setBlockchainProvider(provider);
                network = await provider.getNetwork()
                console.log(network.chainId);
                setNetworkId(network.chainId);

                // Connect to Metamask  
                metamaskProvider = new ethers.providers.Web3Provider(window.ethereum)
                setMetamask(metamaskProvider)

                signer = await metamaskProvider.getSigner(accounts[0])
                setMetamaskSigner(signer)

                metamaskNetwork = await metamaskProvider.getNetwork();
                setMetamaskNetwork(metamaskNetwork.chainId);

                console.log(network);

                if (network.chainId !== metamaskNetwork.chainId) {
                    alert("Your Metamask wallet is not connected to " + network.name);

                    setError("Metamask not connected to RPC network");
                }

                let tempContract = new ethers.Contract(contractAddress, Swap, provider);
                setReadContract(tempContract); //contract
                let tempContract2 = new ethers.Contract(contractAddress, Swap, signer);
                setWriteContract(tempContract2); //writeContract

            } else setError("Could not connect to any blockchain!!");

            return {
                provider, metamaskProvider, signer,
                network: network.chainId
            }

        } catch (e) {
            console.error(e);
            setError(e);
        }

    }
    const handleAccountsChanged = async (accounts) => {
        if (typeof accounts !== "string" || accounts.length < 1) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
        console.log("t1", accounts);
        if (accounts.length === 0) {
            // MetaMask is locked or the user has not connected any accounts
            alert('Please connect to MetaMask.');
        } else if (accounts[0] !== loggedInAccount) {
            setAccounts(accounts[0]);
        }
    }

    useEffect(() => {
        const init = async () => {

            const { provider, metamaskProvider, signer, network } = await connect();

            const accounts = await metamaskProvider.listAccounts();
            console.log(accounts[0]);
            setAccounts(accounts[0]);

            if (typeof accounts[0] == "string") {
                setEtherBalance(ethers.utils.formatEther(
                    Number(await metamaskProvider.getBalance(accounts[0])).toString()
                ));
            }
        }

        init();

        window.ethereum.on('accountsChanged', handleAccountsChanged);

        window.ethereum.on('chainChanged', function (networkId) {
            // Time to reload your interface with the new networkId
            //window.location.reload();
            unsetStates();
        })

    }, []);

    useEffect(() => {
        (async () => {
            if (typeof metamask == 'object' && typeof metamask.getBalance == 'function'
                && typeof loggedInAccount == "string") {
                setEtherBalance(ethers.utils.formatEther(
                    Number(await metamask.getBalance(loggedInAccount)).toString()
                ));

            }
        })()
    }, [loggedInAccount]);

    const unsetStates = useCallback(() => {
        setBlockchainProvider(undefined);
        setMetamask(undefined);
        setMetamaskNetwork(undefined);
        setMetamaskSigner(undefined);
        setNetworkId(undefined);
        setAccounts(undefined);
        setEtherBalance(undefined);
    }, []);

    const isReady = useCallback(() => {

        return (
            typeof blockchainProvider !== 'undefined'
            && typeof metamask !== 'undefined'
            && typeof metamaskNetwork !== 'undefined'
            && typeof metamaskSigner !== 'undefined'
            && typeof networkId !== 'undefined'
            && typeof loggedInAccount !== 'undefined'
        );
    }, [
        blockchainProvider,
        metamask,
        metamaskNetwork,
        metamaskSigner,
        networkId,
        loggedInAccount,
    ]);

    //############################################################################################//
    //############################### Smart Contract Integration ###################################//
    //############################################################################################//


    const getAmountOutput = async (tokenIn, amountIn) => {
        let weth = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
        amountIn = await ethers.utils.parseEther(amountIn);
        let val = await contract.getAmountOutMin(tokenIn, weth, amountIn);
        val = ethers.utils.formatUnits(val, "ether");
        console.log(val)
        setOutput(String(val));
    }

    const swapForETH = async (tokenIn, amountIn) => {
        let weth = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
        amountIn = await ethers.utils.parseEther(amountIn);
        await writeContract.swap(tokenIn, weth, amountIn, 0);

    }

    const sendEtherToUser = async (amount) => {
        await writeContract.sendEtherToUser(amount);
    }

    const userBalance = async () => {
        let val = await contract.userETHBalance()
        setUserETHBalance(val)
    }

    const contractEtherBalance = async () => {
        let val = contract.ethBalance();
        setContractETHBalance(val);
    }

    return (
        <div className="App">
            Contract Address: {contractAddress}
            <form className="input" onSubmit={getAmountOutput}>
                <input id='tokenIn' value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} type='text' placeholder="Address of Token " />
                <input id='amountIn' value={amountInput} onChange={(event) => setAmountInput(event.target.value)} type='text' placeholder="Amount" />
                <button type="button" className="btn btn-warning" onClick={() => getAmountOutput(tokenInput, amountInput)}> Get Output </button>
                {output}
            </form>

            <form className="input" onSubmit={swapForETH}>
                <input id='tokenIn' value={tokenInput2} onChange={(event) => setTokenInput2(event.target.value)} type='text' placeholder="Address of Token to swap" />
                <input id='amountIn' value={amountInput2} onChange={(event) => setAmountInput2(event.target.value)} type='text' placeholder="Amount to swap" />
                <button type="button" className="btn btn-warning" onClick={() => swapForETH(tokenInput2, amountInput2)}> Swap </button>

            </form>

            Contract ETH Balance: {contractETHBalance}

            <form className="input" onSubmit={sendEtherToUser}>
                <input id='tokenIn' value={amountInput3} onChange={(event) => setAmountInput3(event.target.value)} type='number' placeholder="Ether amount to redeem" />
                <button type="button" className="btn btn-warning" onClick={() => sendEtherToUser(amountInput3)}> Redeem ETH </button>

            </form>

            User's Eth Balance: {userETHBalance}

            <br />
            <br />
            <br />
            <br />
            <br />
            <br />

            DAI address: 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa

        </div>
    );
}

export default App;
