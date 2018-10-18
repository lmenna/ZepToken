/**
 * @title latestTime.js
 *
 * Wrapped for web3 method to get timestamp for latest block.
 *
 */
 export default function latestTime () {
  return web3.eth.getBlock('latest').timestamp;
}
