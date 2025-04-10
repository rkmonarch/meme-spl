"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useWallet } from "@jup-ag/wallet-adapter";
import ConnectButton from "./ConnectedButton";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  createAndMint,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  percentAmount,
  transactionBuilder,
  publicKey as toUmiPublicKey,
  sol,
} from "@metaplex-foundation/umi";
import { mplToolbox, transferSol } from "@metaplex-foundation/mpl-toolbox";

const NETWORKS = {
  SOON: {
    name: "SOON Mainnet",
    rpcUrl: "https://rpc.mainnet.soo.network/rpc",
    explorerUrl: "https://explorer.soo.network",
    fee: 0.002,
  },
  SVM_BNB: {
    name: "svmBNB Mainnet",
    rpcUrl: "https://rpc.svmbnbmainnet.soo.network/rpc",
    explorerUrl: "https://explorer.svmbnbmainnet.soo.network",
    fee: 0.005,
  },
};

const FEE_RECEIVER = "GdUXESh35ZUPqPtovzfMdFbeMMzjnp5LNYZtikLA9Eqf";

export default function Hero() {
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS.SOON);

  const [file, setFile] = useState<File>();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorSite, setCreatorSite] = useState("");
  const [url, setUrl] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cid, setCid] = useState("");
  const [metadataUrl, setMetadataUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintAddress, setMintAddress] = useState("");
  const [mintError, setMintError] = useState("");
  const [tokenSupply, setTokenSupply] = useState(1000000000);
  const [tokenDecimals, setTokenDecimals] = useState(9);
  const [transactionProgress, setTransactionProgress] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [transactionExplorerUrl, setTransactionExplorerUrl] = useState("");
  const [fileError, setFileError] = useState("");

  const MAX_FILE_SIZE = 80 * 1024;

  const containerStyle = {
    height: "100vh",
    overflowY: "scroll" as const,
    paddingBottom: "200px",
    position: "relative" as const,
  };

  const wallet = useWallet();
  const { publicKey, connected } = wallet;

  const handleNetworkChange = (network: string) => {
    setSelectedNetwork(NETWORKS[network as keyof typeof NETWORKS]);
    setTransactionExplorerUrl("");
    setMintAddress("");
    setMintError("");
    setTransactionProgress("");
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    console.log("Wallet connected state:", connected);
    console.log("Public key:", publicKey?.toString() || "No public key");
    console.log("Selected network:", selectedNetwork.name);

    document.body.style.height = "auto";
    document.body.style.overflow = "auto";
  }, [connected, publicKey, url, metadataUrl, minting, selectedNetwork]);

  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File size (${(file.size / 1024).toFixed(
          2
        )}KB) exceeds the maximum limit of 80KB`
      );
      return false;
    }
    setFileError("");
    return true;
  };

  const uploadFile = async () => {
    try {
      if (!file) {
        alert("No file selected");
        return;
      }

      if (!validateFile(file)) {
        return;
      }

      if (!name.trim()) {
        alert("Please enter a name for your token");
        return;
      }

      if (!symbol.trim()) {
        alert("Please enter a symbol for your token");
        return;
      }

      setUploading(true);

      const data = new FormData();
      data.set("file", file);
      const uploadRequest = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const imageCid = await uploadRequest.json();
      setCid(imageCid);

      const imageUrl = `https://ipfs.io/ipfs/${imageCid}`;
      setUrl(imageUrl);

      const metadata = {
        name: name,
        symbol: symbol,
        image: imageUrl,
        description: description,
        creator: {
          name: creatorName || "anonymous",
          site: creatorSite || "",
        },
        attributes: [],
        properties: {
          files: [{ uri: imageUrl, type: "image/jpeg" }],
          category: "image",
        },
      };

      const jsonResponse = await fetch("/api/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      const jsonData = await jsonResponse.json();
      setMetadataUrl(jsonData.url);

      setUploading(false);

      setTimeout(() => {
        scrollToSection("preview-section");
      }, 100);
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file or creating metadata");
    }
  };

  const mintSplToken = async () => {
    if (!connected || !publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setMinting(true);
      setMintError("");
      setTransactionProgress("Preparing transaction...");

      console.log(`Using RPC URL: ${selectedNetwork.rpcUrl}`);
      console.log(`Fee amount: ${selectedNetwork.fee} SOL`);

      const umi = createUmi(selectedNetwork.rpcUrl)
        .use(mplTokenMetadata())
        .use(mplToolbox())
        .use(walletAdapterIdentity(wallet));

      const mintSigner = generateSigner(umi);

      setMintAddress(mintSigner.publicKey.toString());

      const amount = BigInt(tokenSupply) * BigInt(10) ** BigInt(tokenDecimals);

      setTransactionProgress(
        `Sending ${selectedNetwork.fee} ${
          selectedNetwork === NETWORKS.SOON ? "ETH" : "BNB"
        } transaction fee...`
      );

      const feeReceiver = toUmiPublicKey(FEE_RECEIVER);

      const feePaymentTx = transactionBuilder().add(
        transferSol(umi, {
          source: umi.identity,
          destination: feeReceiver,
          amount: sol(selectedNetwork.fee),
        })
      );

      const { signature: feeSignature } = await feePaymentTx.sendAndConfirm(
        umi
      );
      console.log(
        `Fee payment successful. Signature: ${feeSignature.toString()}`
      );

      setTransactionProgress("Creating token metadata and minting tokens...");

      const createTokenTx = transactionBuilder().add(
        createAndMint(umi, {
          mint: mintSigner,
          authority: umi.identity,
          name: name,
          symbol: symbol,
          uri: metadataUrl,
          sellerFeeBasisPoints: percentAmount(0),
          decimals: 9,
          amount: amount,
          tokenOwner: umi.identity.publicKey,
          tokenStandard: TokenStandard.Fungible,
        })
      );

      const { signature: createTokenSignature } =
        await createTokenTx.sendAndConfirm(umi);
      console.log(
        "Token metadata created successfully. Signature:",
        createTokenSignature.toString()
      );

      setTransactionExplorerUrl(
        `${selectedNetwork.explorerUrl}/address/${mintAddress}`
      );

      setTransactionProgress(
        "Success! Token created with 1 billion tokens minted to your wallet."
      );
      setMinting(false);

      setTimeout(() => {
        scrollToSection("transaction-status");
      }, 100);
    } catch (error) {
      console.error("Error minting token:", error);
      setMintError(error instanceof Error ? error.message : String(error));
      setTransactionProgress("");
      setMinting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target?.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      validateFile(selectedFile);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value);
  };

  const handleCreatorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreatorName(e.target.value);
  };

  const handleCreatorSiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreatorSite(e.target.value);
  };

  return (
    <div style={containerStyle} className="bg-gray-900 text-white">
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Network:</span>
            <div className="bg-gray-800 rounded-lg p-1 flex">
              <button
                onClick={() => handleNetworkChange("SOON")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedNetwork === NETWORKS.SOON
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                SOON
              </button>
              <button
                onClick={() => handleNetworkChange("SVM_BNB")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedNetwork === NETWORKS.SVM_BNB
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                svmBNB
              </button>
            </div>
          </div>

          <div className="ml-auto">
            <ConnectButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 sm:px-6 lg:px-8">
        <div className="border border-yellow-600 bg-yellow-900/30 p-3 rounded mb-6">
          <p>Wallet Connected: {connected ? "Yes" : "No"}</p>
          <p>Public Key: {publicKey ? publicKey.toString() : "Not detected"}</p>
          <p>Selected Network: {selectedNetwork.name}</p>
          <p>
            Creation Fee: {selectedNetwork.fee}{" "}
            {selectedNetwork === NETWORKS.SOON ? "ETH" : "BNB"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium pb-2 border-b border-gray-800">
              Token Details
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block">
                  Token Name:
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g., My Token"
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="symbol" className="block">
                  Token Symbol:
                </label>
                <input
                  id="symbol"
                  type="text"
                  value={symbol}
                  onChange={handleSymbolChange}
                  placeholder="e.g., MTK"
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block">
                  Description:
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="e.g., This is my fungible token"
                  rows={3}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>

              <fieldset className="border border-gray-700 p-4 rounded-md">
                <legend className="px-2">Creator Information</legend>
                <div className="space-y-2">
                  <label htmlFor="creatorName" className="block">
                    Creator Name:
                  </label>
                  <input
                    id="creatorName"
                    type="text"
                    value={creatorName}
                    onChange={handleCreatorNameChange}
                    placeholder="e.g., Your Name"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                  />
                </div>
                <div className="space-y-2 mt-2">
                  <label htmlFor="creatorSite" className="block">
                    Creator Website:
                  </label>
                  <input
                    id="creatorSite"
                    type="text"
                    value={creatorSite}
                    onChange={handleCreatorSiteChange}
                    placeholder="e.g., https://yourwebsite.com"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                  />
                </div>
              </fieldset>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium pb-2 border-b border-gray-800">
              Supply & Image
            </h2>

            <fieldset className="border border-gray-700 p-4 rounded-md">
              <legend className="px-2">Token Supply Configuration</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="tokenSupply" className="block">
                    Initial Supply:
                  </label>
                  <input
                    id="tokenSupply"
                    type="number"
                    min="1"
                    value={tokenSupply}
                    onChange={(e) => setTokenSupply(Number(e.target.value))}
                    placeholder="e.g., 1000000000"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                  />
                  <p className="text-xs text-gray-400">
                    Initial token amount (1 billion)
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tokenDecimals" className="block">
                    Decimals:
                  </label>
                  <input
                    id="tokenDecimals"
                    type="number"
                    min="0"
                    max="9"
                    value={tokenDecimals}
                    onChange={(e) => setTokenDecimals(Number(e.target.value))}
                    placeholder="e.g., 9"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                  />
                  <p className="text-xs text-gray-400">Decimal places (0-9)</p>
                </div>
              </div>
            </fieldset>

            <div className="space-y-2">
              <label htmlFor="file" className="block">
                Upload Token Logo (max 80KB):
              </label>
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                accept="image/png,image/jpeg,image/gif"
              />
              {fileError && (
                <p className="text-red-400 text-sm mt-1">{fileError}</p>
              )}
              <p className="text-xs text-gray-400">
                Image must be less than 80KB for faster processing
              </p>
            </div>

            <button
              type="button"
              disabled={uploading || !!fileError}
              onClick={uploadFile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Processing..." : "Upload and Create Metadata"}
            </button>

            {!connected && (
              <div className="text-center mt-2">
                <p className="text-sm text-yellow-500">
                  Connect your wallet to mint a token
                </p>
              </div>
            )}
          </div>
        </div>

        {url && (
          <div
            id="preview-section"
            className="border border-gray-700 rounded-lg p-6 mt-8 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">Token Preview</h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative w-40 h-40 bg-black rounded-lg overflow-hidden">
                <Image
                  src={url}
                  alt={name || "Token image"}
                  fill
                  className="object-contain"
                  unoptimized={true}
                />
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">{name}</h3>
                  <p className="text-gray-300 text-sm mb-4">{description}</p>

                  <div className="space-y-1">
                    <p>
                      <strong>Symbol:</strong> {symbol}
                    </p>
                    <p>
                      <strong>Creator:</strong> {creatorName || "anonymous"}
                    </p>
                    {creatorSite && (
                      <p>
                        <strong>Website:</strong> {creatorSite}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="space-y-1 mb-4">
                    <p>
                      <strong>Supply:</strong> {tokenSupply.toLocaleString()}
                    </p>
                    <p>
                      <strong>Decimals:</strong> {tokenDecimals}
                    </p>
                    <p>
                      <strong>Network:</strong> {selectedNetwork.name}
                    </p>
                    <p>
                      <strong>Fee:</strong> {selectedNetwork.fee}{" "}
                      {selectedNetwork === NETWORKS.SOON ? "ETH" : "BNB"}
                    </p>
                  </div>

                  <p className="text-sm font-medium mb-1">Metadata URL:</p>
                  <a
                    href={metadataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm truncate block hover:underline mb-4"
                  >
                    {metadataUrl}
                  </a>

                  <button
                    id="mint-button"
                    onClick={mintSplToken}
                    disabled={minting || !connected || !publicKey}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-4 text-lg rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {minting
                      ? "Processing..."
                      : `Create Token (Fee: ${selectedNetwork.fee} ${
                          selectedNetwork === NETWORKS.SOON ? "ETH" : "BNB"
                        })`}
                  </button>
                </div>
              </div>
            </div>

            <div id="transaction-status" className="mt-6">
              {transactionProgress && (
                <div className="p-3 bg-blue-900/50 border border-blue-700 rounded">
                  <p className="text-sm">{transactionProgress}</p>
                </div>
              )}

              {mintAddress && (
                <div className="p-3 mt-2 bg-green-900/50 border border-green-700 rounded">
                  <p className="font-medium text-sm">Token mint address:</p>
                  <a
                    href={`${selectedNetwork.explorerUrl}/address/${mintAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm break-all hover:underline"
                  >
                    {mintAddress}
                  </a>
                </div>
              )}

              {mintError && (
                <div className="p-3 mt-2 bg-red-900/50 border border-red-700 rounded">
                  <p className="font-medium text-sm">Error minting token:</p>
                  <p className="break-all text-sm text-red-300">{mintError}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="h-96"></div>
      </div>
    </div>
  );
}
