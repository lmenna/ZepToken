/**
 * @title Ether.js
 *
 * Contains helper functions used to convert between Ether, Wei and Bignumbers.
 * Part of the package of helpers for unit testing smart contracts
 *
 */

 export default function ether(n) {
   return new web3.BigNumber(web3.toWei(n, 'ether'));
 }
