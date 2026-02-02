/* eslint-disable max-len */
const BlockType = require('../extension-support/block-type');
const ArgumentType = require('../extension-support/argument-type');
// const bs58 = require('bs58');
// const token = require('@solana/spl-token');
// const web3 = require('@solana/web3.js');

// eslint-disable-next-line max-len
const cgIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzIzOF81MTM5KSI+CjxwYXRoIGQ9Ik05NS4zMjAxIDQ3Ljc4NDhDOTUuNDM3IDc0LjI5MzEgNzQuMTk1NSA5NS44ODE4IDQ3Ljg3NTcgOTUuOTk5NUMyMS41NTI1IDk2LjExNzIgMC4xMjA2NzcgNzQuNzIzNiAwLjAwMDQ3OTg2IDQ4LjIxNTJDLTAuMTE2Mzc4IDIxLjcwMzUgMjEuMTI1MSAwLjExODE3OSA0Ny40NDUgMC4wMDA0ODMzNzNDNzMuNzY4MSAtMC4xMTcyMTIgOTUuMiAyMS4yNzMxIDk1LjMxNjggNDcuNzg0OEg5NS4zMjAxWiIgZmlsbD0iIzhEQzYzRiIvPgo8cGF0aCBkPSJNOTEuNzI3NiA0Ny43OTc5QzkxLjgzNzggNzIuMzEyMiA3Mi4xOTU1IDkyLjI3MzMgNDcuODU5IDkyLjM4NDNDMjMuNTE5IDkyLjQ5NTMgMy42OTk4OCA3Mi43MTI0IDMuNTg5NjkgNDguMTk4MUMzLjQ3OTUxIDIzLjY4MzkgMjMuMTIxNyAzLjcyMjczIDQ3LjQ2MTYgMy42MTE3N0M3MS43OTgyIDMuNTA0MTYgOTEuNjE3NCAyMy4yODM3IDkxLjcyNzYgNDcuNzk3OVoiIGZpbGw9IiNGOUU5ODgiLz4KPHBhdGggZD0iTTQ4LjQ2MzMgNi40ODczMkM1MS4yNDExIDUuOTM5MTkgNTQuMTI1OSA2LjAxMzE3IDU2LjkzNzIgNi40NzA1MUM1OS43NDg0IDYuOTQ0NjUgNjIuNTE5NiA3LjgxODk2IDY1LjAyNzEgOS4xOTc2N0M2Ny41Mzc5IDEwLjU4OTggNjkuNzExNCAxMi40NzYzIDcxLjg3NSAxNC4yNDg1Qzc0LjAzMTkgMTYuMDQwOCA3Ni4xODg3IDE3LjgyOTggNzguMjM1NCAxOS43OTdDODAuMzAyMSAyMS43NDQgODIuMTU1MiAyMy45NTMzIDgzLjY1NzYgMjYuMzk0NkM4NS4xODY4IDI4LjgxNTggODYuNTE5IDMxLjM4NDkgODcuNDYwNiAzNC4xMDU0Qzg5LjMwMDIgMzkuNTQ5NiA4OS45Mzc5IDQ1LjQxNzYgODkuMDIzMSA1MS4wMTMxSDg4LjczOTNDODcuODE3OCA0NS40NjQ2IDg2LjU2NTggNDAuMTgxOCA4NC42MTI1IDM1LjE1MTJDODMuNjYxIDMyLjYzNTkgODIuNjMyNiAzMC4xNDA3IDgxLjM1MzkgMjcuNzU5OUM4MC4wNDg0IDI1LjM5OTMgNzguNjUyOCAyMy4wNjg5IDc3LjA2NjggMjAuODI5M0M3NS40NjQyIDE4LjYwOTkgNzMuNTYxMSAxNi41Njg4IDcxLjMxNzQgMTQuOTg0OUM2OS4wODA0IDEzLjM4MDkgNjYuNTA2MiAxMi4zMzg1IDY0LjAxODggMTEuMzQ5OEM2MS41MjQ3IDEwLjM0NzcgNTkuMDQwNiA5LjM4MjYyIDU2LjQ1MyA4LjYzMjc0QzUzLjg2ODggNy44NjI2NyA1MS4yMjExIDcuMzE3OTEgNDguNDYzMyA2Ljc2OTc5VjYuNDgzOTZWNi40ODczMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik03MC4wMDg3IDMyLjExNDRDNjYuODEwMSAzMS4xODMgNjMuNDk4IDI5Ljg1ODEgNjAuMTM5MiAyOC41MjMxQzU5Ljk0NTUgMjcuNjc1NiA1OS4yMDEgMjYuNjE5OCA1Ny42OTE4IDI1LjMyNTFDNTUuNDk4MiAyMy40MDgzIDUxLjM3ODEgMjMuNDU4OCA0Ny44MTkgMjQuMzA2MkM0My44ODkyIDIzLjM3NDcgNDAuMDA2MiAyMy4wNDE4IDM2LjI4MDEgMjMuOTQzQzUuODEwMDggMzIuNDAwMyAyMy4wODUxIDUzLjAyMzkgMTEuODk2NyA3My43NjE4QzEzLjQ4OTMgNzcuMTYxNSAzMC42NDc1IDk3LjAwODMgNTUuNDc0OSA5MS42ODE3QzU1LjQ3NDkgOTEuNjgxNyA0Ni45ODQzIDcxLjEzMjEgNjYuMTQ1NyA2MS4yNjU5QzgxLjY4NzkgNTMuMjY2IDkyLjkxNjMgMzguNDA5NSA3MC4wMDU0IDMyLjExMTFMNzAuMDA4NyAzMi4xMTQ0WiIgZmlsbD0iIzhCQzUzRiIvPgo8cGF0aCBkPSJNNzMuNzY4MSA0NS42MjkzQzczLjc2ODEgNDYuNjU0OSA3Mi45NDY4IDQ3LjQ5MjIgNzEuOTI4NCA0Ny40OTU2QzcwLjkxMDEgNDcuNTAyMyA3MC4wNzg3IDQ2LjY3MTcgNzAuMDcyMSA0NS42NDI3QzcwLjA2NTQgNDQuNjE3MSA3MC44OTAxIDQzLjc3OTggNzEuOTExNyA0My43NzY0QzcyLjkzMDEgNDMuNzY5NyA3My43NjE0IDQ0LjYwMDMgNzMuNzY4MSA0NS42MjU5VjQ1LjYyOTNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNDcuODE5IDI0LjMxMDFDNTAuMDM5MyAyNC40NjgxIDU4LjA2NTggMjcuMTA3OSA2MC4xMzU4IDI4LjUyMzZDNTguNDE5NyAyMy40Nzk1IDUyLjYwMDEgMjIuODEwMyA0Ny44MTkgMjQuMzEwMVoiIGZpbGw9IiMwMDkzNDUiLz4KPHBhdGggZD0iTTQ5LjkyOTEgMzcuMDYwN0M0OS45MjkxIDQxLjgwMjIgNDYuMTEyOCA0NS42NDI0IDQxLjQwODUgNDUuNjQyNEMzNi43MDQxIDQ1LjY0MjQgMzIuODg3OCA0MS44MDIyIDMyLjg4NzggMzcuMDYwN0MzMi44ODc4IDMyLjMxOTMgMzYuNzA0MSAyOC40ODI0IDQxLjQwODUgMjguNDgyNEM0Ni4xMTI4IDI4LjQ4MjQgNDkuOTI5MSAzMi4zMjI3IDQ5LjkyOTEgMzcuMDYwN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00Ny40MDQ5IDM3LjE0MTZDNDcuNDA0OSA0MC40NzQgNDQuNzIwNSA0My4xNzc2IDQxLjQxMTcgNDMuMTc3NkMzOC4xMDMgNDMuMTc3NiAzNS40MTg2IDQwLjQ3NzQgMzUuNDE4NiAzNy4xNDE2QzM1LjQxODYgMzMuODA1NyAzOC4xMDMgMzEuMTA1NSA0MS40MTE3IDMxLjEwNTVDNDQuNzIwNSAzMS4xMDU1IDQ3LjQwNDkgMzMuODA5MSA0Ny40MDQ5IDM3LjE0MTZaIiBmaWxsPSIjNTg1OTVCIi8+CjxwYXRoIGQ9Ik04MC42NzI2IDQ5LjQwOTFDNzMuNzcxMyA1NC4zMDg2IDY1LjkxNTEgNTguMDI0NCA1NC43ODAyIDU4LjAyNDRDNDkuNTY4MyA1OC4wMjQ0IDQ4LjUwOTkgNTIuNDQ1NyA0NS4wNjQzIDU1LjE3OTZDNDMuMjg0NyA1Ni41OTE5IDM3LjAxNDQgNTkuNzQ5NSAzMi4wMzYyIDU5LjUxMDhDMjcuMDE0NiA1OS4yNjg3IDE4Ljk5ODIgNTYuMzI5NiAxNi43NDQ1IDQ1LjYzMjhDMTUuODUzIDU2LjMyOTYgMTUuMzk4OSA2NC4yMTE5IDExLjQwOTEgNzMuMjQ0MUMxOS4zNTIxIDg2LjA1MjcgMzguMjg2NSA5NS45MzI0IDU1LjQ3NDcgOTEuNjg1M0M1My42MjgzIDc4LjY5NTEgNjQuOTAwMSA2NS45NzM5IDcxLjI1MDUgNTkuNDYzN0M3My42NTQ1IDU2Ljk5ODggNzguMjYyIDUyLjk3MzYgODAuNjcyNiA0OS40MDkxWiIgZmlsbD0iIzhCQzUzRiIvPgo8cGF0aCBkPSJNODAuNDAyNCA0OS43MzIxQzc4LjI1ODggNTEuNjk5MyA3NS43MDggNTMuMTU4NyA3My4xMTA0IDU0LjQ0MzJDNzAuNDg2MSA1NS42OTA4IDY3Ljc1MTYgNTYuNzA2MyA2NC45MjcgNTcuNDQyOEM2Mi4xMTI0IDU4LjE3NTkgNTkuMTcwOSA1OC43MjczIDU2LjE5MjcgNTguNDU4M0M1My4yNjc5IDU4LjE5OTQgNTAuMTc2MSA1Ny4xNjM3IDQ4LjIwMjkgNTQuOTIwN0w0OC4yOTY0IDU0LjgxMzFDNTAuNzMwNCA1Ni4zOTM2IDUzLjUwNDkgNTYuOTQ4NSA1Ni4yNzk1IDU3LjAyOTJDNTkuMDU0IDU3LjEwMzIgNjEuODgyIDU2Ljg5NDcgNjQuNjY5OSA1Ni4zMjY0QzY3LjQ1MTEgNTUuNzQ4IDcwLjE4MjMgNTQuODgzOCA3Mi44MjMzIDUzLjc4NzVDNzUuNDU3NiA1Mi42OTEzIDc4LjA2MTkgNTEuNDIzNSA4MC4zMDg5IDQ5LjYyMTFMODAuMzk5IDQ5LjcyODdMODAuNDAyNCA0OS43MzIxWiIgZmlsbD0iIzU4NTk1QiIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzIzOF81MTM5Ij4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=';
// eslint-disable-next-line max-len
const MenuiconURI = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzIzOF81MTM5KSI+CjxwYXRoIGQ9Ik05NS4zMjAxIDQ3Ljc4NDhDOTUuNDM3IDc0LjI5MzEgNzQuMTk1NSA5NS44ODE4IDQ3Ljg3NTcgOTUuOTk5NUMyMS41NTI1IDk2LjExNzIgMC4xMjA2NzcgNzQuNzIzNiAwLjAwMDQ3OTg2IDQ4LjIxNTJDLTAuMTE2Mzc4IDIxLjcwMzUgMjEuMTI1MSAwLjExODE3OSA0Ny40NDUgMC4wMDA0ODMzNzNDNzMuNzY4MSAtMC4xMTcyMTIgOTUuMiAyMS4yNzMxIDk1LjMxNjggNDcuNzg0OEg5NS4zMjAxWiIgZmlsbD0iIzhEQzYzRiIvPgo8cGF0aCBkPSJNOTEuNzI3NiA0Ny43OTc5QzkxLjgzNzggNzIuMzEyMiA3Mi4xOTU1IDkyLjI3MzMgNDcuODU5IDkyLjM4NDNDMjMuNTE5IDkyLjQ5NTMgMy42OTk4OCA3Mi43MTI0IDMuNTg5NjkgNDguMTk4MUMzLjQ3OTUxIDIzLjY4MzkgMjMuMTIxNyAzLjcyMjczIDQ3LjQ2MTYgMy42MTE3N0M3MS43OTgyIDMuNTA0MTYgOTEuNjE3NCAyMy4yODM3IDkxLjcyNzYgNDcuNzk3OVoiIGZpbGw9IiNGOUU5ODgiLz4KPHBhdGggZD0iTTQ4LjQ2MzMgNi40ODczMkM1MS4yNDExIDUuOTM5MTkgNTQuMTI1OSA2LjAxMzE3IDU2LjkzNzIgNi40NzA1MUM1OS43NDg0IDYuOTQ0NjUgNjIuNTE5NiA3LjgxODk2IDY1LjAyNzEgOS4xOTc2N0M2Ny41Mzc5IDEwLjU4OTggNjkuNzExNCAxMi40NzYzIDcxLjg3NSAxNC4yNDg1Qzc0LjAzMTkgMTYuMDQwOCA3Ni4xODg3IDE3LjgyOTggNzguMjM1NCAxOS43OTdDODAuMzAyMSAyMS43NDQgODIuMTU1MiAyMy45NTMzIDgzLjY1NzYgMjYuMzk0NkM4NS4xODY4IDI4LjgxNTggODYuNTE5IDMxLjM4NDkgODcuNDYwNiAzNC4xMDU0Qzg5LjMwMDIgMzkuNTQ5NiA4OS45Mzc5IDQ1LjQxNzYgODkuMDIzMSA1MS4wMTMxSDg4LjczOTNDODcuODE3OCA0NS40NjQ2IDg2LjU2NTggNDAuMTgxOCA4NC42MTI1IDM1LjE1MTJDODMuNjYxIDMyLjYzNTkgODIuNjMyNiAzMC4xNDA3IDgxLjM1MzkgMjcuNzU5OUM4MC4wNDg0IDI1LjM5OTMgNzguNjUyOCAyMy4wNjg5IDc3LjA2NjggMjAuODI5M0M3NS40NjQyIDE4LjYwOTkgNzMuNTYxMSAxNi41Njg4IDcxLjMxNzQgMTQuOTg0OUM2OS4wODA0IDEzLjM4MDkgNjYuNTA2MiAxMi4zMzg1IDY0LjAxODggMTEuMzQ5OEM2MS41MjQ3IDEwLjM0NzcgNTkuMDQwNiA5LjM4MjYyIDU2LjQ1MyA4LjYzMjc0QzUzLjg2ODggNy44NjI2NyA1MS4yMjExIDcuMzE3OTEgNDguNDYzMyA2Ljc2OTc5VjYuNDgzOTZWNi40ODczMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik03MC4wMDg3IDMyLjExNDRDNjYuODEwMSAzMS4xODMgNjMuNDk4IDI5Ljg1ODEgNjAuMTM5MiAyOC41MjMxQzU5Ljk0NTUgMjcuNjc1NiA1OS4yMDEgMjYuNjE5OCA1Ny42OTE4IDI1LjMyNTFDNTUuNDk4MiAyMy40MDgzIDUxLjM3ODEgMjMuNDU4OCA0Ny44MTkgMjQuMzA2MkM0My44ODkyIDIzLjM3NDcgNDAuMDA2MiAyMy4wNDE4IDM2LjI4MDEgMjMuOTQzQzUuODEwMDggMzIuNDAwMyAyMy4wODUxIDUzLjAyMzkgMTEuODk2NyA3My43NjE4QzEzLjQ4OTMgNzcuMTYxNSAzMC42NDc1IDk3LjAwODMgNTUuNDc0OSA5MS42ODE3QzU1LjQ3NDkgOTEuNjgxNyA0Ni45ODQzIDcxLjEzMjEgNjYuMTQ1NyA2MS4yNjU5QzgxLjY4NzkgNTMuMjY2IDkyLjkxNjMgMzguNDA5NSA3MC4wMDU0IDMyLjExMTFMNzAuMDA4NyAzMi4xMTQ0WiIgZmlsbD0iIzhCQzUzRiIvPgo8cGF0aCBkPSJNNzMuNzY4MSA0NS42MjkzQzczLjc2ODEgNDYuNjU0OSA3Mi45NDY4IDQ3LjQ5MjIgNzEuOTI4NCA0Ny40OTU2QzcwLjkxMDEgNDcuNTAyMyA3MC4wNzg3IDQ2LjY3MTcgNzAuMDcyMSA0NS42NDI3QzcwLjA2NTQgNDQuNjE3MSA3MC44OTAxIDQzLjc3OTggNzEuOTExNyA0My43NzY0QzcyLjkzMDEgNDMuNzY5NyA3My43NjE0IDQ0LjYwMDMgNzMuNzY4MSA0NS42MjU5VjQ1LjYyOTNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNDcuODE5IDI0LjMxMDFDNTAuMDM5MyAyNC40NjgxIDU4LjA2NTggMjcuMTA3OSA2MC4xMzU4IDI4LjUyMzZDNTguNDE5NyAyMy40Nzk1IDUyLjYwMDEgMjIuODEwMyA0Ny44MTkgMjQuMzEwMVoiIGZpbGw9IiMwMDkzNDUiLz4KPHBhdGggZD0iTTQ5LjkyOTEgMzcuMDYwN0M0OS45MjkxIDQxLjgwMjIgNDYuMTEyOCA0NS42NDI0IDQxLjQwODUgNDUuNjQyNEMzNi43MDQxIDQ1LjY0MjQgMzIuODg3OCA0MS44MDIyIDMyLjg4NzggMzcuMDYwN0MzMi44ODc4IDMyLjMxOTMgMzYuNzA0MSAyOC40ODI0IDQxLjQwODUgMjguNDgyNEM0Ni4xMTI4IDI4LjQ4MjQgNDkuOTI5MSAzMi4zMjI3IDQ5LjkyOTEgMzcuMDYwN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00Ny40MDQ5IDM3LjE0MTZDNDcuNDA0OSA0MC40NzQgNDQuNzIwNSA0My4xNzc2IDQxLjQxMTcgNDMuMTc3NkMzOC4xMDMgNDMuMTc3NiAzNS40MTg2IDQwLjQ3NzQgMzUuNDE4NiAzNy4xNDE2QzM1LjQxODYgMzMuODA1NyAzOC4xMDMgMzEuMTA1NSA0MS40MTE3IDMxLjEwNTVDNDQuNzIwNSAzMS4xMDU1IDQ3LjQwNDkgMzMuODA5MSA0Ny40MDQ5IDM3LjE0MTZaIiBmaWxsPSIjNTg1OTVCIi8+CjxwYXRoIGQ9Ik04MC42NzI2IDQ5LjQwOTFDNzMuNzcxMyA1NC4zMDg2IDY1LjkxNTEgNTguMDI0NCA1NC43ODAyIDU4LjAyNDRDNDkuNTY4MyA1OC4wMjQ0IDQ4LjUwOTkgNTIuNDQ1NyA0NS4wNjQzIDU1LjE3OTZDNDMuMjg0NyA1Ni41OTE5IDM3LjAxNDQgNTkuNzQ5NSAzMi4wMzYyIDU5LjUxMDhDMjcuMDE0NiA1OS4yNjg3IDE4Ljk5ODIgNTYuMzI5NiAxNi43NDQ1IDQ1LjYzMjhDMTUuODUzIDU2LjMyOTYgMTUuMzk4OSA2NC4yMTE5IDExLjQwOTEgNzMuMjQ0MUMxOS4zNTIxIDg2LjA1MjcgMzguMjg2NSA5NS45MzI0IDU1LjQ3NDcgOTEuNjg1M0M1My42MjgzIDc4LjY5NTEgNjQuOTAwMSA2NS45NzM5IDcxLjI1MDUgNTkuNDYzN0M3My42NTQ1IDU2Ljk5ODggNzguMjYyIDUyLjk3MzYgODAuNjcyNiA0OS40MDkxWiIgZmlsbD0iIzhCQzUzRiIvPgo8cGF0aCBkPSJNODAuNDAyNCA0OS43MzIxQzc4LjI1ODggNTEuNjk5MyA3NS43MDggNTMuMTU4NyA3My4xMTA0IDU0LjQ0MzJDNzAuNDg2MSA1NS42OTA4IDY3Ljc1MTYgNTYuNzA2MyA2NC45MjcgNTcuNDQyOEM2Mi4xMTI0IDU4LjE3NTkgNTkuMTcwOSA1OC43MjczIDU2LjE5MjcgNTguNDU4M0M1My4yNjc5IDU4LjE5OTQgNTAuMTc2MSA1Ny4xNjM3IDQ4LjIwMjkgNTQuOTIwN0w0OC4yOTY0IDU0LjgxMzFDNTAuNzMwNCA1Ni4zOTM2IDUzLjUwNDkgNTYuOTQ4NSA1Ni4yNzk1IDU3LjAyOTJDNTkuMDU0IDU3LjEwMzIgNjEuODgyIDU2Ljg5NDcgNjQuNjY5OSA1Ni4zMjY0QzY3LjQ1MTEgNTUuNzQ4IDcwLjE4MjMgNTQuODgzOCA3Mi44MjMzIDUzLjc4NzVDNzUuNDU3NiA1Mi42OTEzIDc4LjA2MTkgNTEuNDIzNSA4MC4zMDg5IDQ5LjYyMTFMODAuMzk5IDQ5LjcyODdMODAuNDAyNCA0OS43MzIxWiIgZmlsbD0iIzU4NTk1QiIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzIzOF81MTM5Ij4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=`;

class Coingecko {
    static apiKey = '';
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'coingecko',
            name: 'CoinGecko',
            color1: '#8bc540',
            color2: '#8bc540',
            menuIconURI: MenuiconURI,
            blocks: [
                {
                    opcode: 'setApi',
                    blockType: BlockType.COMMAND,
                    text: '[COINGECKO] Set CoinGecko Pro API to [api]',
                    arguments: {
                        api: {
                            type: ArgumentType.STRING,
                            defaultValue: 'API Key'
                        },
                        COINGECKO: {
                            type: ArgumentType.IMAGE,
                            dataURI: cgIconURI
                        }
                    }
                },

                {
                    opcode: 'getLatestPools',
                    blockType: BlockType.REPORTER,
                    text: '[COINGECKO] Get latest pools',
                    arguments: {
                        COINGECKO: {
                            type: ArgumentType.IMAGE,
                            dataURI: cgIconURI
                        }
                    }
                },

                {
                    opcode: 'getTokenInfo',
                    blockType: BlockType.REPORTER,
                    text: '[COINGECKO] Get token info of [ta]',
                    arguments: {
                        ta: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Token Address'
                        },
                        COINGECKO: {
                            type: ArgumentType.IMAGE,
                            dataURI: cgIconURI
                        }
                    }
                },
                // TODO: Make get token price data block when we figure out how we will have arrays in alpha.
                {
                    opcode: 'getTopGainers',
                    blockType: BlockType.REPORTER,
                    text: '[COINGECKO] Get top [number] gainers of [duration]',
                    arguments: {
                        number: {
                            type: ArgumentType.STRING,
                            menu: 'number'
                        },
                        duration: {
                            type: ArgumentType.STRING,
                            menu: 'duration'
                        },
                        COINGECKO: {
                            type: ArgumentType.IMAGE,
                            dataURI: cgIconURI
                        }
                    }
                },

                {
                    opcode: 'getTrendingPools',
                    blockType: BlockType.REPORTER,
                    text: '[COINGECKO] Get trending pools of [duration]',
                    arguments: {
                        duration: {
                            type: ArgumentType.STRING,
                            menu: 'durationtp'
                        },
                        COINGECKO: {
                            type: ArgumentType.IMAGE,
                            dataURI: cgIconURI
                        }
                    }
                },

                {
                    opcode: 'getTrendingTokens',
                    blockType: BlockType.REPORTER,
                    text: '[COINGECKO] Get trending tokens',
                    arguments: {
                        COINGECKO: {
                            type: ArgumentType.IMAGE,
                            dataURI: cgIconURI
                        }
                    }
                }

            ],
            menus: {
                networks: {
                    acceptReporters: true,
                    items: ['mainnet-beta', 'devnet', 'testnet']
                },
                number: {
                    acceptReporters: true,
                    items: ['300', '500', '1000', 'all']
                },
                duration: {
                    acceptReporters: true,
                    items: ['1h', '24h', '7d', '14d', '30d', '60d', '1y']
                },
                durationtp: {
                    acceptReporters: true,
                    items: ['5m', '1h', '24h', '6h']
                }
            }
        };
    }

    setApi (args) {
        const api = args.api;
        Coingecko.apiKey = api;
    }

    async getLatestPools () {
        try {
            const url = `https://pro-api.coingecko.com/api/v3/onchain/networks/solana/new_pools?include=base_token,network&x_cg_pro_api_key=${Coingecko.apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
            return data;
        } catch (e) {
            throw new Error(
                `Error fetching latest pools from CoinGecko: ${e.message}`
            );
        }
    }

    async getTokenInfo (args) {
        const ta = args.ta;
        try {
            const url = `https://pro-api.coingecko.com/api/v3/onchain/networks/solana/tokens/${ta}/info?x_cg_pro_api_key=${Coingecko.apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
        
            return data;
        } catch (e) {
            throw new Error(
                `Error fetching token info from CoinGecko: ${e.message}`
            );
        }
    }

    async getTopGainers (args) {
        const number = args.number;
        const duration = args.duration;
        try {
            const url = `https://pro-api.coingecko.com/api/v3/coins/top_gainers_losers?vs_currency=usd&duration=${duration}&top_coins=${number}&x_cg_pro_api_key=${Coingecko.apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
        
            return data;
        } catch (e) {
            throw new Error(
                `Error fetching top gainers from CoinGecko: ${e.message}`
            );
        }
    }

    async getTrendingPools (args) {
        const duration = args.duration;
        try {
            const url = `https://pro-api.coingecko.com/api/v3/onchain/networks/solana/trending_pools?include=base_token,network&duration=${duration}&x_cg_pro_api_key=${Coingecko.apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
        
            return data;
        } catch (e) {
            throw new Error(
                `Error fetching trending pools from CoinGecko: ${e.message}`
            );
        }
    }

    async getTrendingTokens () {
        try {
            const url = `https://pro-api.coingecko.com/api/v3/search/trending?x_cg_pro_api_key=${Coingecko.apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
        
            return data;
        } catch (e) {
            throw new Error(`Couldn't get trending tokens: ${e.message}`);
        }
    }

}

module.exports = Coingecko;
