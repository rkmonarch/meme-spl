# SPL Token Creator

A web-app that allows users to create SPL tokens on SOON and svmBNB networks with customizable properties and metadata.

<img width="1460" alt="image" src="https://github.com/user-attachments/assets/346e9939-5cb7-450a-8f78-49c512fcedfa" />

## Features

- **Multi-Network Support**: Create tokens on either SOON Mainnet or svmBNB Mainnet
- **Token Customization**: Set token name, symbol, description, and other metadata
- **Custom Token Image**: Upload and attach an image to your token metadata (up to 80KB)
- **Automatic IPFS Storage**: Token images and metadata are automatically stored on IPFS
- **User-Friendly Interface**: Clean, responsive UI with real-time feedback
- **Wallet Integration**: Seamless connection with compatible Solana wallets
- **Transaction Tracking**: Monitor token creation progress and access explorer links

## Prerequisites

Before using the SPL Token Creator, ensure you have:

- A compatible Solana wallet extension installed (like Backpack, OKX, etc.)
- Sufficient ETH (on SOON Mainnet) or BNB (on svmBNB Mainnet) for the creation fee and gas

## Usage Guide

### 1. Connect Your Wallet

- Visit the SPL Token Creator application
- Click the "Connect Wallet" button in the top-right corner
- Select your wallet provider and approve the connection

### 2. Select Network

- Choose between "SOON" and "svmBNB" networks using the toggle at the top

### 3. Configure Token Details

- **Token Name**: Enter a name for your token (required)
- **Token Symbol**: Enter a symbol/ticker for your token (required)
- **Description**: Describe your token (optional)
- **Creator Information**: Add your name and website (optional)
- **Supply**: Set the initial token supply (default: 1,000,000,000)
- **Decimals**: Set the decimal places for your token (default: 9)

### 4. Upload Token Logo

- Click "Choose File" to select an image (PNG, JPEG, or GIF)
- Image must be less than 80KB for optimal processing
- Click "Upload and Create Metadata" to process your image and token information

### 5. Review and Create Token

- Review your token details in the preview section
- Confirm the network and fee information
- Click "Create Token" to initiate the creation process
- Approve both transactions in your wallet:
  1. Fee payment transaction
  2. Token creation transaction

### 6. Access Your Token

- Once created, your token mint address will be displayed
- Click the link to view your token on the explorer
- Your tokens will be automatically added to your connected wallet

## Technical Details

The SPL Token Creator uses:

- Next.js for the frontend framework
- Jupiter wallet adapter for Solana wallet connections
- Metaplex UMI framework for token operations
- IPFS for storage of images and metadata
- Solana SPL Token standard for token creation

## Fee Structure

A small fee is charged for token creation to cover infrastructure costs:
- SOON Mainnet: 0.002 ETH
- svmBNB Mainnet: 0.005 BNB

## Troubleshooting

Common issues and solutions:

- **Wallet Connection Failed**: Ensure your wallet extension is installed and unlocked
- **Transaction Error**: Check that you have sufficient funds for the fee and gas
- **Image Upload Failed**: Verify your image is less than 80KB and in a supported format

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/rkmonarch/meme-spl.git

# Navigate to project directory
cd meme-spl

# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following variables:

```
PINATA_JWT=
NEXT_PUBLIC_GATEWAY_URL=
```



