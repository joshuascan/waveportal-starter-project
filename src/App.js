import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import { abi } from "./utils/WavePortal.json";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [messageValue, setMessageValue] = useState("");
  const [totalWaves, setTotalWaves] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const contractAddress = "0xc8c171b68656f5c5E3e2519105845d6D77CDDe9F";
  const contractABI = abi;

  const getAllWaves = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
        setTotalWaves(wavesCleaned.length);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected ", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllWaves();
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waveTxn = await wavePortalContract.wave(messageValue, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);
        setIsLoading(true);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        let count = await wavePortalContract.getTotalWaves();
        setTotalWaves(count.toNumber());
        setIsLoading(false);
        setMessageValue("");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMessageChange = (event) => {
    setMessageValue(event.target.value);
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="hand waving">
            👋
          </span>{" "}
          Hey there!
        </div>

        <div className="bio">Connect your Ethereum wallet and wave at me!</div>

        {!currentAccount ? (
          <button className="connectButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div className="dataContainer">
            <div className="waveCount">{totalWaves} total waves!</div>
            <input
              name="message"
              className="messageInput"
              value={messageValue}
              onChange={handleMessageChange}
              placeholder="Write your message..."
              disabled={isLoading}
            />
            <button className="waveButton" onClick={wave} disabled={isLoading}>
              Wave at Me
            </button>

            {isLoading && <div className="loading">Loading...</div>}

            {allWaves
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((wave, index) => {
                return (
                  <div key={index} className="waveContainer">
                    <div>
                      <span className="bold">Message:</span> {wave.message}
                    </div>
                    <div>
                      <span className="bold">From:</span>{" "}
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://rinkeby.etherscan.io/address/${wave.address}/`}
                      >
                        {wave.address}
                      </a>
                    </div>
                    <div>
                      <span className="bold">Time:</span>{" "}
                      {wave.timestamp.toString()}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
