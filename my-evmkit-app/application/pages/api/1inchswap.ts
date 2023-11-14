const {Web3} = require("web3");
const yesno = require("yesno");

require("dotenv").config();

const chainId = 8217; // Chain ID for Klatyn
const web3RpcUrl = "https://public-en-baobab.klaytn.net"; // URL for POLygon node
const walletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Your wallet address
const privateKey = process.env.PRIVATE_KEY; // Your wallet's private key. NEVER SHARE THIS WITH ANYONE

// set allowance to router 0x1111111254eeb25477b68fb85ed929f73a960582
// polygon example
// src: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Token address of USDC 10**6
// dst: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // Token address of DAI
// amount: "50", // Amount of WETH to swap (in wei) 0.00005 = 50000000000000 , USDC 50 = 0.00005

const swapParams = {
    // src: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", // Token address of WETH 10**18
    src: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Token address of WETH 10**18
    // src: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Token address of USDC 10**6
    dst: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // Token address of DAI
    amount: "5000", // Amount of WETH to swap (in wei) 0.00005 = 50000000000000 , USDC 50 = 0.00005
    from: walletAddress,
    slippage: 1, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
    disableEstimate: false, // Set to true to disable estimation of swap details
    allowPartialFill: false, // Set to true to allow partial filling of the swap order
  };

  const broadcastApiUrl = "https://api.1inch.dev/tx-gateway/v1.1/" + chainId + "/broadcast";
  const apiBaseUrl = "https://api.1inch.dev/swap/v5.2/" + chainId;
  const web3 = new Web3(web3RpcUrl);
  const headers = { headers: { Authorization: process.env.APIONEINCH, accept: "application/json" } };

// helper fucntions 
// Construct full API request URL
function apiRequestUrl(methodName, queryParams) {
    return apiBaseUrl + methodName + "?" + new URLSearchParams(queryParams).toString();
  }
  
  // Post raw transaction to the API and return transaction hash
  async function broadCastRawTransaction(rawTransaction) {
    return fetch(broadcastApiUrl, {
      method: "post",
      body: JSON.stringify({ rawTransaction }),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.APIONEINCH}` },
    })
      .then((res) => res.json())
      .then((res) => {
        return res.transactionHash;
      });
  }
  
  async function checkAllowance(tokenAddress : string, walletAddress : string) {
    const apiBaseUrl = `https://api.1inch.dev/swap/v5.2/${chainId}`; // Assuming chainId 137 for Polygon
    const methodName = "/approve/allowance";
    const queryParams = { tokenAddress, walletAddress };
    const url = apiBaseUrl + methodName + "?" + new URLSearchParams(queryParams).toString();
    const head = { headers: { Authorization: process.env.APIONEINCH, accept: "application/json" } };
    try {
      const response = await fetch(url , head);
      const data = await response.json();
      console.log(data,"data returned from checkAllowance")
      return data.allowance;
    } catch (error) {
      console.error("Error checking allowance:", error);
      throw error;
    }
  }

  // Sign and post a transaction, return its hash
  async function signAndSendTransaction(transaction) {
    const { rawTransaction } = await web3.eth.accounts.signTransaction(transaction, privateKey);
  
    return await broadCastRawTransaction(rawTransaction);
  }

  // approve txn
  async function buildTxForApproveTradeWithRouter(tokenAddress, amount) {
    const url = apiRequestUrl("/approve/transaction", amount ? { tokenAddress, amount } : { tokenAddress });
    const header = { headers: { Authorization: process.env.APIONEINCH, accept: "application/json" } };

    const transaction = await fetch(url, header);
    console.log(transaction,"transaction");
    const transactionForSign = await transaction.json();
    console.log(transactionForSign,"transactionForSign");
    const gasLimit = await web3.eth.estimateGas({
      ...transaction,
      from: walletAddress,
    });
  
    return {
      ...transaction,
      gas: gasLimit,
    };
  }

  // swap txn
async function buildTxForSwap(swapParams) {
    const url = apiRequestUrl("/swap", swapParams);
  
    // Fetch the swap transaction details from the API
    return fetch(url, headers)
      .then((res) => res.json())
      .then((res) => console.log(res,"res"))
      .then((res) => res.tx);
  }
  
  const swap = async (swapParams) => {
    const swapTransaction = await buildTxForSwap(swapParams);
    console.log(swapTransaction, swapParams,"swapTransaction");
    console.log("Transaction for swap: ", swapTransaction);
  
    const ok = await yesno({
      question: "Do you want to send a transaction to exchange with 1inch router?",
    });
    
    if (!ok) {
      return false;
    }
    
    const swapTxHash = await signAndSendTransaction(swapTransaction);
    console.log("Swap tx hash: ", swapTxHash);
  }

  checkAllowance(swapParams.src, swapParams.from)
  .then((allowance) => {
    if (allowance === "0") {
      console.log("Allowance is 0, approving...");
      
      const appprovetokens = async () => {

        const transactionForSign = await buildTxForApproveTradeWithRouter(swapParams.src , swapParams.amount);
        console.log(transactionForSign,"transactionForSign");
        const ok = await yesno({
          question: "Do you want to send a transaction to approve trade with 1inch router?",
        });
        
        if (!ok) {
          return false;
        }
        
        // doing manual 

        const testspp= {
          "data": "0x095ea7b30000000000000000000000001111111254eeb25477b68fb85ed929f73a96058200000000000000000000000000000000000000000000000000000000000001f4",
          "gasPrice": "29728389834",
          "to": "0xdac17f958d2ee523a2206206994597c13d831ec7",
          "value": "0"
        }

        const gasLimit = await web3.eth.estimateGas({
          ...testspp,
          from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        });
        const approveTxHash = await signAndSendTransaction({ testspp, gas: gasLimit});
        console.log("Approve tx hash: ", approveTxHash);
      }
       appprovetokens();
    }

    else if (allowance !== "0") {
        console.log("Allowance is sufficient, swapping...");
        swap(swapParams);
    }
  }).catch((error) => {
    console.error("Error swapping:", error);
  });