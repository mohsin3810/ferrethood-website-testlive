const CONTRACT = "0x39008E8f6Eb9a36C6864f95FBBaC75101e842f08";
const CHAIN_ID = 4663;
const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const EXPLORER = "https://robinhoodchain.blockscout.com";

const ABI = [
  "function mint(uint256 _mintAmount) payable",
  "function whitelistMint(uint256 _mintAmount, bytes32[] _merkleProof) payable",
  "function cost() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function maxMintAmountPerTx() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function paused() view returns (bool)",
  "function whitelistMintEnabled() view returns (bool)",
  "function whitelistClaimed(address) view returns (bool)"
];

let provider, signer, contract, account;
let qty = 1;
let contractRead;

const $ = id => document.getElementById(id);
const setStatus = (msg, cls="") => { $("txStatus").textContent = msg; $("txStatus").className = `tx-status ${cls}`; };

function updateQty() {
  $("qty").textContent = qty;
  const price = Number(window.priceEth || 0.0015);
  $("total").textContent = `${(price * qty).toFixed(4).replace(/0+$/,"").replace(/\.$/,"")} ETH`;
}
$("minus").onclick = () => { qty = Math.max(1, qty-1); updateQty(); };
$("plus").onclick = () => { qty = Math.min(Number(window.maxTx || 100), qty+1); updateQty(); };

async function loadChainData() {
  try {
    contractRead = new ethers.Contract(CONTRACT, ABI, new ethers.JsonRpcProvider(RPC_URL));
    const [cost, supply, maxSupply, maxTx] = await Promise.all([
      contractRead.cost(), contractRead.totalSupply(), contractRead.maxSupply(), contractRead.maxMintAmountPerTx()
    ]);
    window.priceEth = Number(ethers.formatEther(cost));
    window.maxTx = Number(maxTx);
    $("minted").textContent = Number(supply).toLocaleString();
    $("supply").textContent = Number(maxSupply).toLocaleString();
    $("maxTx").textContent = Number(maxTx).toLocaleString();
    $("price").textContent = window.priceEth.toString();
    qty = Math.min(qty, window.maxTx);
    updateQty();
  } catch(e) {
    console.warn("Chain read failed", e);
    $("minted").textContent = "—";
  }
}

async function connect() {
  if (!window.ethereum) {
    setStatus("No EVM wallet detected. Open this page in a wallet browser or install a wallet extension.", "error");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== CHAIN_ID) {
      $("walletStatus").textContent = "Wrong network — switch to Robinhood Chain.";
      setStatus("Please switch your wallet to Robinhood Chain (chain ID 4663).", "error");
      $("mintBtn").textContent = "SWITCH TO ROBINHOOD CHAIN";
      return;
    }
    signer = await provider.getSigner();
    account = await signer.getAddress();
    contract = new ethers.Contract(CONTRACT, ABI, signer);
    $("walletStatus").textContent = `Connected: ${account.slice(0,6)}…${account.slice(-4)}`;
    $("connectBtn").textContent = "CONNECTED";
    $("mintBtn").textContent = "MINT NOW";
    setStatus("");
  } catch(e) {
    setStatus(e.shortMessage || e.message || "Wallet connection failed.", "error");
  }
}

async function mint() {
  if (!signer) return connect();
  try {
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== CHAIN_ID) {
      setStatus("Wrong network. Switch to Robinhood Chain.", "error"); return;
    }
    const [cost, paused] = await Promise.all([contract.cost(), contract.paused()]);
    if (paused) { setStatus("Public mint is currently paused.", "error"); return; }

    const value = cost * BigInt(qty);
    $("mintBtn").disabled = true;
    $("mintBtn").textContent = "CONFIRM IN WALLET…";
    setStatus(`Sending ${qty} NFT${qty > 1 ? "s" : ""} for ${ethers.formatEther(value)} ETH…`);
    const tx = await contract.mint(qty, { value });
    setStatus(`Transaction submitted. Waiting for confirmation…`);
    $("txStatus").innerHTML = `Transaction submitted. <a href="${EXPLORER}/tx/${tx.hash}" target="_blank" rel="noreferrer" style="color:#bca8ff">View transaction ↗</a>`;
    await tx.wait();
    setStatus("Mint successful! Welcome to the FerretHood. ✦", "success");
    $("mintBtn").textContent = "MINT AGAIN";
    await loadChainData();
  } catch(e) {
    setStatus(e.shortMessage || e.reason || "Transaction cancelled or failed.", "error");
    $("mintBtn").textContent = "MINT NOW";
  } finally {
    $("mintBtn").disabled = false;
  }
}

$("connectBtn").onclick = connect;
$("mintBtn").onclick = mint;

if (window.ethereum) {
  window.ethereum.on?.("accountsChanged", () => location.reload());
  window.ethereum.on?.("chainChanged", () => location.reload());
}
loadChainData();
updateQty();

async function loadOpenSea() {
  const grid = $("openseaGrid");
  const meta = $("openseaMeta");
  try {
    const r = await fetch("/api/opensea");
    if (!r.ok) throw new Error("OpenSea API unavailable");
    const data = await r.json();
    const nfts = data.nfts || [];
    if (!nfts.length) throw new Error("No NFTs returned");
    grid.innerHTML = nfts.slice(0, 6).map(n => {
      const img = n.image_url || n.display_image_url || n.original_image_url;
      const url = n.opensea_url || `https://opensea.io/assets/${data.chain || "robinhood"}/${CONTRACT}/${n.identifier}`;
      return `<a class="live-nft" href="${url}" target="_blank" rel="noreferrer">
        <img src="${img || "assets/reveal.png"}" loading="lazy" alt="${(n.name || "FerretHood NFT").replace(/"/g,"&quot;")}">
        <span>${n.name || `FerretHood #${n.identifier}`}</span>
      </a>`;
    }).join("");
    meta.textContent = `Showing ${Math.min(6,nfts.length)} live NFTs from OpenSea.`;
  } catch (e) {
    grid.innerHTML = `<div class="loading-card"><div><p>OpenSea live feed is ready, but its secure API connection still needs to be configured.</p><a href="https://opensea.io/collection/ferrethood" target="_blank" rel="noreferrer" style="color:#bca8ff">VIEW THE COLLECTION ↗</a></div></div>`;
  }
}
loadOpenSea();
