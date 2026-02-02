const BlockType = require('../extension-support/block-type');
const ArgumentType = require('../extension-support/argument-type');
const {Buffer} = require('buffer');
const JUP_API = 'https://quote-api.jup.ag/v6';
const bs58 = require('bs58');
const token = require('@solana/spl-token');
const web3 = require('@solana/web3.js');
const Solana = require('./solana');
const {PhantomWalletAdapter} = require('@solana/wallet-adapter-phantom');
const {BackpackWalletAdapter} = require('@solana/wallet-adapter-backpack');
const {SolflareWalletAdapter} = require('@solana/wallet-adapter-solflare');
const {SlopeWalletAdapter} = require('@solana/wallet-adapter-slope');
const {GlowWalletAdapter} = require('@solana/wallet-adapter-glow');
const {BraveWalletAdapter} = require('@solana/wallet-adapter-brave');

// eslint-disable-next-line max-len
const JupIconURI = 'data:image/svg+xml,%3Csvg%20version%3D%221.1%22%20id%3D%22katman_1%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20xmlns%3Axlink%3D%22http%3A//www.w3.org/1999/xlink%22%20x%3D%220px%22%20y%3D%220px%22%20viewBox%3D%220%200%20800%20800%22%20style%3D%22enable-background%3Anew%200%200%20800%20800%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E.st0%7Bfill%3A%23141726%3B%7D.st1%7Bfill%3Aurl(%23SVGID_1_)%3B%7D.st2%7Bfill%3Aurl(%23SVGID_2_)%3B%7D.st3%7Bfill%3Aurl(%23SVGID_3_)%3B%7D.st4%7Bfill%3Aurl(%23SVGID_4_)%3B%7D.st5%7Bfill%3Aurl(%23SVGID_5_)%3B%7D.st6%7Bfill%3Aurl(%23SVGID_6_)%3B%7D%3C/style%3E%3Ccircle%20class%3D%22st0%22%20cx%3D%22400%22%20cy%3D%22400%22%20r%3D%22400%22/%3E%3ClinearGradient%20id%3D%22SVGID_1_%22%20gradientUnits%3D%22userSpaceOnUse%22%20x1%3D%22574.9257%22%20y1%3D%22665.8727%22%20x2%3D%22248.5257%22%20y2%3D%22142.3127%22%20gradientTransform%3D%22matrix(1%200%200%20-1%200%20800)%22%3E%3Cstop%20offset%3D%220.16%22%20style%3D%22stop-color%3A%23C6F462%22/%3E%3Cstop%20offset%3D%220.89%22%20style%3D%22stop-color%3A%2333D9FF%22/%3E%3C/linearGradient%3E%3Cpath%20class%3D%22st1%22%20d%3D%22M536%2C568.9c-66.8-108.5-166.4-170-289.4-195.6c-43.5-9-87.2-8.9-129.4%2C7.7c-28.9%2C11.4-33.3%2C23.4-19.7%2C53.7%0A%09c92.4-21.9%2C178.4-1.5%2C258.9%2C45c81.1%2C46.9%2C141.6%2C112.2%2C169.1%2C205c38.6-11.8%2C43.6-18.3%2C34.3-54.2C554.3%2C609.4%2C547.4%2C587.4%2C536%2C568.9%0AL536%2C568.9z%22/%3E%3ClinearGradient%20id%3D%22SVGID_2_%22%20gradientUnits%3D%22userSpaceOnUse%22%20x1%3D%22572.5896%22%20y1%3D%22667.3303%22%20x2%3D%22246.1996%22%20y2%3D%22143.7703%22%20gradientTransform%3D%22matrix(1%200%200%20-1%200%20800)%22%3E%3Cstop%20offset%3D%220.16%22%20style%3D%22stop-color%3A%23C6F462%22/%3E%3Cstop%20offset%3D%220.89%22%20style%3D%22stop-color%3A%2333D9FF%22/%3E%3C/linearGradient%3E%3Cpath%20class%3D%22st2%22%20d%3D%22M609.1%2C480.6c-85.8-125-207.3-194.9-355.8-218.3c-39.3-6.2-79.4-4.5-116.2%2C14.3c-17.6%2C9-33.2%2C20.5-37.4%2C44.9%0A%09c115.8-31.9%2C219.7-3.7%2C317.5%2C53c98.3%2C57%2C175.1%2C133.5%2C205%2C251.1c20.8-18.4%2C24.5-41%2C19.1-62C633.9%2C534.8%2C625.5%2C504.5%2C609.1%2C480.6%0AL609.1%2C480.6z%22/%3E%3ClinearGradient%20id%3D%22SVGID_3_%22%20gradientUnits%3D%22userSpaceOnUse%22%20x1%3D%22577.0148%22%20y1%3D%22664.5671%22%20x2%3D%22250.6247%22%20y2%3D%22141.0071%22%20gradientTransform%3D%22matrix(1%200%200%20-1%200%20800)%22%3E%3Cstop%20offset%3D%220.16%22%20style%3D%22stop-color%3A%23C6F462%22/%3E%3Cstop%20offset%3D%220.89%22%20style%3D%22stop-color%3A%2333D9FF%22/%3E%3C/linearGradient%3E%3Cpath%20class%3D%22st3%22%20d%3D%22M105%2C488.6c7.3%2C16.2%2C12.1%2C34.5%2C23%2C47.6c5.5%2C6.7%2C22.2%2C4.1%2C33.8%2C5.7c1.8%2C0.2%2C3.6%2C0.5%2C5.4%2C0.7%0A%09c102.9%2C15.3%2C184.1%2C65.1%2C242.1%2C152c3.4%2C5.1%2C8.9%2C12.7%2C13.4%2C12.7c17.4-0.1%2C34.9-2.8%2C52.5-4.5C449%2C557.5%2C232.8%2C438.3%2C105%2C488.6%0AL105%2C488.6z%22/%3E%3ClinearGradient%20id%3D%22SVGID_4_%22%20gradientUnits%3D%22userSpaceOnUse%22%20x1%3D%22569.0272%22%20y1%3D%22669.5518%22%20x2%3D%22242.6272%22%20y2%3D%22145.9917%22%20gradientTransform%3D%22matrix(1%200%200%20-1%200%20800)%22%3E%3Cstop%20offset%3D%220.16%22%20style%3D%22stop-color%3A%23C6F462%22/%3E%3Cstop%20offset%3D%220.89%22%20style%3D%22stop-color%3A%2333D9FF%22/%3E%3C/linearGradient%3E%3Cpath%20class%3D%22st4%22%20d%3D%22M656.6%2C366.7C599.9%2C287.4%2C521.7%2C234.6%2C432.9%2C197c-61.5-26.1-125.2-41.8-192.8-33.7%0A%09c-23.4%2C2.8-45.3%2C9.5-63.4%2C24.7c230.9%2C5.8%2C404.6%2C105.8%2C524%2C303.3c0.2-13.1%2C2.2-27.7-2.6-39.5C686.1%2C422.5%2C674.7%2C392%2C656.6%2C366.7z%22/%3E%3ClinearGradient%20id%3D%22SVGID_5_%22%20gradientUnits%3D%22userSpaceOnUse%22%20x1%3D%22571.6973%22%20y1%3D%22667.8917%22%20x2%3D%22245.2973%22%20y2%3D%22144.3317%22%20gradientTransform%3D%22matrix(1%200%200%20-1%200%20800)%22%3E%3Cstop%20offset%3D%220.16%22%20style%3D%22stop-color%3A%23C6F462%22/%3E%3Cstop%20offset%3D%220.89%22%20style%3D%22stop-color%3A%2333D9FF%22/%3E%3C/linearGradient%3E%3Cpath%20class%3D%22st5%22%20d%3D%22M709.8%2C325.3c-47-178.9-238-265-379.2-221.4C482.7%2C133.9%2C607.5%2C206.4%2C709.8%2C325.3z%22/%3E%3ClinearGradient%20id%3D%22SVGID_6_%22%20gradientUnits%3D%22userSpaceOnUse%22%20x1%3D%22579.0382%22%20y1%3D%22663.3111%22%20x2%3D%22252.6482%22%20y2%3D%22139.7511%22%20gradientTransform%3D%22matrix(1%200%200%20-1%200%20800)%22%3E%3Cstop%20offset%3D%220.16%22%20style%3D%22stop-color%3A%23C6F462%22/%3E%3Cstop%20offset%3D%220.89%22%20style%3D%22stop-color%3A%2333D9FF%22/%3E%3C/linearGradient%3E%3Cpath%20class%3D%22st6%22%20d%3D%22M155.4%2C583.9c54.6%2C69.3%2C124%2C109.7%2C213%2C122.8C334.4%2C643.2%2C214.6%2C574.5%2C155.4%2C583.9L155.4%2C583.9z%22/%3E%3C/svg%3E';
// eslint-disable-next-line max-len
const MenuiconURI = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI0LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9ImthdG1hbl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgODAwIDgwMCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgODAwIDgwMDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiMxNDE3MjY7fQoJLnN0MXtmaWxsOnVybCgjU1ZHSURfMV8pO30KCS5zdDJ7ZmlsbDp1cmwoI1NWR0lEXzJfKTt9Cgkuc3Qze2ZpbGw6dXJsKCNTVkdJRF8zXyk7fQoJLnN0NHtmaWxsOnVybCgjU1ZHSURfNF8pO30KCS5zdDV7ZmlsbDp1cmwoI1NWR0lEXzVfKTt9Cgkuc3Q2e2ZpbGw6dXJsKCNTVkdJRF82Xyk7fQo8L3N0eWxlPgo8Y2lyY2xlIGNsYXNzPSJzdDAiIGN4PSI0MDAiIGN5PSI0MDAiIHI9IjQwMCIvPgo8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzFfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjU3NC45MjU3IiB5MT0iNjY1Ljg3MjciIHgyPSIyNDguNTI1NyIgeTI9IjE0Mi4zMTI3IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIC0xIDAgODAwKSI+Cgk8c3RvcCAgb2Zmc2V0PSIwLjE2IiBzdHlsZT0ic3RvcC1jb2xvcjojQzZGNDYyIi8+Cgk8c3RvcCAgb2Zmc2V0PSIwLjg5IiBzdHlsZT0ic3RvcC1jb2xvcjojMzNEOUZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik01MzYsNTY4LjljLTY2LjgtMTA4LjUtMTY2LjQtMTcwLTI4OS40LTE5NS42Yy00My41LTktODcuMi04LjktMTI5LjQsNy43Yy0yOC45LDExLjQtMzMuMywyMy40LTE5LjcsNTMuNwoJYzkyLjQtMjEuOSwxNzguNC0xLjUsMjU4LjksNDVjODEuMSw0Ni45LDE0MS42LDExMi4yLDE2OS4xLDIwNWMzOC42LTExLjgsNDMuNi0xOC4zLDM0LjMtNTQuMkM1NTQuMyw2MDkuNCw1NDcuNCw1ODcuNCw1MzYsNTY4LjkKCUw1MzYsNTY4Ljl6Ii8+CjxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMl8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iNTcyLjU4OTYiIHkxPSI2NjcuMzMwMyIgeDI9IjI0Ni4xOTk2IiB5Mj0iMTQzLjc3MDMiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgLTEgMCA4MDApIj4KCTxzdG9wICBvZmZzZXQ9IjAuMTYiIHN0eWxlPSJzdG9wLWNvbG9yOiNDNkY0NjIiLz4KCTxzdG9wICBvZmZzZXQ9IjAuODkiIHN0eWxlPSJzdG9wLWNvbG9yOiMzM0Q5RkYiLz4KPC9saW5lYXJHcmFkaWVudD4KPHBhdGggY2xhc3M9InN0MiIgZD0iTTYwOS4xLDQ4MC42Yy04NS44LTEyNS0yMDcuMy0xOTQuOS0zNTUuOC0yMTguM2MtMzkuMy02LjItNzkuNC00LjUtMTE2LjIsMTQuM2MtMTcuNiw5LTMzLjIsMjAuNS0zNy40LDQ0LjkKCWMxMTUuOC0zMS45LDIxOS43LTMuNywzMTcuNSw1M2M5OC4zLDU3LDE3NS4xLDEzMy41LDIwNSwyNTEuMWMyMC44LTE4LjQsMjQuNS00MSwxOS4xLTYyQzYzMy45LDUzNC44LDYyNS41LDUwNC41LDYwOS4xLDQ4MC42CglMNjA5LjEsNDgwLjZ6Ii8+CjxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfM18iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iNTc3LjAxNDgiIHkxPSI2NjQuNTY3MSIgeDI9IjI1MC42MjQ3IiB5Mj0iMTQxLjAwNzEiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgLTEgMCA4MDApIj4KCTxzdG9wICBvZmZzZXQ9IjAuMTYiIHN0eWxlPSJzdG9wLWNvbG9yOiNDNkY0NjIiLz4KCTxzdG9wICBvZmZzZXQ9IjAuODkiIHN0eWxlPSJzdG9wLWNvbG9yOiMzM0Q5RkYiLz4KPC9saW5lYXJHcmFkaWVudD4KPHBhdGggY2xhc3M9InN0MyIgZD0iTTEwNSw0ODguNmM3LjMsMTYuMiwxMi4xLDM0LjUsMjMsNDcuNmM1LjUsNi43LDIyLjIsNC4xLDMzLjgsNS43CgljMTAyLjksMTUuMywxODQuMSw2NS4xLDI0Mi4xLDE1MmMzLjQsNS4xLDguOSwxMi43LDEzLjQsMTIuN2MxNy40LTAuMSwzNC45LTIuOCw1Mi41LTQuNUM0NDksNTU3LjUsMjMyLjgsNDM4LjMsMTA1LDQ4OC42CglMMTA1LDQ4OC42eiIvPgo8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzRfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjU2OS4wMjcyIiB5MT0iNjY5LjU1MTgiIHgyPSIyNDIuNjI3MiIgeTI9IjE0NS45OTE3IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIC0xIDAgODAwKSI+Cgk8c3RvcCAgb2Zmc2V0PSIwLjE2IiBzdHlsZT0ic3RvcC1jb2xvcjojQzZGNDYyIi8+Cgk8c3RvcCAgb2Zmc2V0PSIwLjg5IiBzdHlsZT0ic3RvcC1jb2xvcjojMzNEOUZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxwYXRoIGNsYXNzPSJzdDQiIGQ9Ik02NTYuNiwzNjYuN0M1OTkuOSwyODcuNCw1MjEuNywyMzQuNiw0MzIuOSwxOTdjLTYxLjUtMjYuMS0xMjUuMi00MS44LTE5Mi44LTMzLjcKCWMtMjMuNCwyLjgtNDUuMyw5LjUtNjMuNCwyNC43YzIzMC45LDUuOCw0MDQuNiwxMDUuOCw1MjQsMzAzLjNjMC4yLTEzLjEsMi4yLTI3LjctMi42LTM5LjVDNjg2LjEsNDIyLjUsNjc0LjcsMzkyLDY1Ni42LDM2Ni43eiIvPgo8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzVfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjU3MS42OTczIiB5MT0iNjY3Ljg5MTciIHgyPSIyNDUuMjk3MyIgeTI9IjE0NC4zMzE3IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIC0xIDAgODAwKSI+Cgk8c3RvcCAgb2Zmc2V0PSIwLjE2IiBzdHlsZT0ic3RvcC1jb2xvcjojQzZGNDYyIi8+Cgk8c3RvcCAgb2Zmc2V0PSIwLjg5IiBzdHlsZT0ic3RvcC1jb2xvcjojMzNEOUZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxwYXRoIGNsYXNzPSJzdDUiIGQ9Ik03MDkuOCwzMjUuM2MtNDctMTc4LjktMjM4LTI2NS0zNzkuMi0yMjEuNEM0ODIuNywxMzMuOSw2MDcuNSwyMDYuNCw3MDkuOCwzMjUuM3oiLz4KPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF82XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSI1NzkuMDM4MiIgeTE9IjY2My4zMTExIiB4Mj0iMjUyLjY0ODIiIHkyPSIxMzkuNzUxMSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAtMSAwIDgwMCkiPgoJPHN0b3AgIG9mZnNldD0iMC4xNiIgc3R5bGU9InN0b3AtY29sb3I6I0M2RjQ2MiIvPgoJPHN0b3AgIG9mZnNldD0iMC44OSIgc3R5bGU9InN0b3AtY29sb3I6IzMzRDlGRiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8cGF0aCBjbGFzcz0ic3Q2IiBkPSJNMTU1LjQsNTgzLjljNTQuNiw2OS4zLDEyNCwxMDkuNywyMTMsMTIyLjhDMzM0LjQsNjQzLjIsMjE0LjYsNTc0LjUsMTU1LjQsNTgzLjlMMTU1LjQsNTgzLjl6Ii8+Cjwvc3ZnPgo=`;
const solIconURI = `data:image/svg+xml,%3Csvg width='101' height='88' viewBox='0 0 101 88' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z' fill='%23FFFFFF'/%3E%3C/svg%3E`;
// eslint-disable-next-line max-len
const sendIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzQyIiBoZWlnaHQ9Ijc0MiIgdmlld0JveD0iMCAwIDc0MiA3NDIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzcxIDc0MkM1NzUuODk4IDc0MiA3NDIgNTc1Ljg5OCA3NDIgMzcxQzc0MiAxNjYuMTAyIDU3NS44OTggMCAzNzEgMEMxNjYuMTAyIDAgMCAxNjYuMTAyIDAgMzcxQzAgNTc1Ljg5OCAxNjYuMTAyIDc0MiAzNzEgNzQyWk01NjEuNjc0IDI4Ny43MzRDNTE4LjE0IDI3MS40NTMgNDkzLjY5MSAyNjMuNjAyIDQ1OC42NjUgMjYwLjMwNEM0NDkuMDcgMjU5LjQwMSA0NDAuNTU5IDI2Ni40NDcgNDM5LjY1NiAyNzYuMDQzQzQzOC43NTIgMjg1LjYzOSA0NDUuNzk5IDI5NC4xNSA0NTUuMzk0IDI5NS4wNTNDNDc0LjA0MSAyOTYuODA4IDQ4OS4xMzMgMjk5Ljk0MiA1MDguMDI4IDMwNS44NTFDNDk2Ljg4MSAzMTAuODQyIDQ4Ny42NTYgMzE1LjIyMSA0NzkuMzUyIDMxOS43OUM0NjEuOTA3IDMyOS4zODkgNDQ4LjQzNCAzMzkuODIgNDI4LjgzIDM1Ny43NThDNDIxLjcyIDM2NC4yNjQgNDIxLjIzIDM3NS4zMDIgNDI3LjczNiAzODIuNDEzQzQzNC4yNDIgMzg5LjUyMyA0NDUuMjggMzkwLjAxMyA0NTIuMzkxIDM4My41MDdDNDcwLjkyNiAzNjYuNTQ4IDQ4Mi4wOTcgMzU4LjExNiA0OTYuMTc3IDM1MC4zNjlDNTA2LjAwNCAzNDQuOTYyIDUxNy4yMTkgMzM5Ljg4NCA1MzMuMzc2IDMzMi44MTFDNTI5LjgxNyAzNTAuNjc2IDUyNS4xNTIgMzY0LjYyIDUxNi41OTYgMzgzLjA3MkM1MTIuNTQxIDM5MS44MTYgNTE2LjM0MyA0MDIuMTkxIDUyNS4wODYgNDA2LjI0NUM1MzMuODMgNDEwLjMgNTQ0LjIwNSA0MDYuNDk4IDU0OC4yNTkgMzk3Ljc1NUM1NjMuMTA2IDM2NS43MzcgNTY3Ljg1NSAzNDQuNDM3IDU3Mi44NjMgMzA2LjM1NUM1NzMuOTIyIDI5OC4zIDU2OS4yODMgMjkwLjU4IDU2MS42NzQgMjg3LjczNFpNMjk3LjYwOCA0NzkuMDcxQzI5My42MTEgNDY2LjgxOSAzMDQuNDAzIDQ1Ni4xMjIgMzE3LjI5IDQ1Ni4xMjJINDI0LjA4N0M0MzYuOTc0IDQ1Ni4xMjIgNDQ3Ljc2NiA0NjYuODE5IDQ0My43NjkgNDc5LjA3MUM0NDMuMTIzIDQ4MS4wNSA0NDIuMzkzIDQ4My4wMDUgNDQxLjU4IDQ4NC45MzJDNDM3LjcyNCA0OTQuMDY2IDQzMi4wNzIgNTAyLjM2NSA0MjQuOTQ3IDUwOS4zNTZDNDE3LjgyMSA1MTYuMzQ3IDQwOS4zNjIgNTIxLjg5MiA0MDAuMDUzIDUyNS42NzZDMzkwLjc0MyA1MjkuNDU5IDM4MC43NjUgNTMxLjQwNiAzNzAuNjg5IDUzMS40MDZDMzYwLjYxMiA1MzEuNDA2IDM1MC42MzQgNTI5LjQ1OSAzNDEuMzI0IDUyNS42NzZDMzMyLjAxNSA1MjEuODkyIDMyMy41NTYgNTE2LjM0NyAzMTYuNDMgNTA5LjM1NkMzMDkuMzA1IDUwMi4zNjUgMzAzLjY1MyA0OTQuMDY2IDI5OS43OTcgNDg0LjkzMkMyOTguOTg0IDQ4My4wMDUgMjk4LjI1NCA0ODEuMDUgMjk3LjYwOCA0NzkuMDcxWk0xNzQuOTM3IDI4OS4yNEMyMDYuOTE5IDI3NC41ODMgMjMyLjAxOCAyNjkuMTU4IDI3Ny44NiAyNjEuNDkxQzI4NS44NzMgMjYwLjE1MSAyOTMuNzUgMjY0LjUxOCAyOTYuODYgMjcyLjAyM0MzMTEuNTY1IDMwNy41MDcgMzE4LjEwMiAzMjguMzI4IDMyMS4yNTMgMzYzLjQ3OUMzMjIuMTE0IDM3My4wNzggMzE1LjAyOSAzODEuNTU4IDMwNS40MyAzODIuNDE4QzI5NS44MyAzODMuMjc5IDI4Ny4zNTEgMzc2LjE5NSAyODYuNDkgMzY2LjU5NUMyODQuNjc0IDM0Ni4zMzcgMjgxLjc0MyAzMzEuOTI5IDI3NS44OTIgMzE0LjY3OEMyNjUuNDM2IDMyOC44ODEgMjU4LjI2MyAzMzguODg3IDI1Mi40NTYgMzQ4LjQ4M0MyNDQuMTM2IDM2Mi4yMzIgMjM4LjY3NyAzNzUuMTIgMjMxLjEwNSAzOTkuMDc0QzIyOC4yIDQwOC4yNjQgMjE4LjM5NiA0MTMuMzU5IDIwOS4yMDYgNDEwLjQ1NEMyMDAuMDE2IDQwNy41NDkgMTk0LjkyMSAzOTcuNzQ1IDE5Ny44MjYgMzg4LjU1NUMyMDUuODM0IDM2My4yMTkgMjEyLjI4NyAzNDcuNDQ5IDIyMi41OTUgMzMwLjQxNEMyMjcuNTAyIDMyMi4zMDUgMjMzLjMwMiAzMTMuOSAyNDAuNDYgMzA0LjAwNEMyMjEuMTQyIDMwOC4zMzQgMjA2LjUwNSAzMTMuMTY2IDE4OS40NzkgMzIwLjk2OUMxODAuNzE3IDMyNC45ODQgMTcwLjM1OSAzMjEuMTM3IDE2Ni4zNDQgMzEyLjM3NUMxNjIuMzI4IDMwMy42MTQgMTY2LjE3NiAyOTMuMjU2IDE3NC45MzcgMjg5LjI0WiIgZmlsbD0iIzI2NThERCIvPgo8L3N2Zz4K';

class Jupiter {
    // ADDED: Map to resolve parent iframe requests
    static pendingRequests = {};

    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /* ADDED: listen for messages from parent window so we can resolve
           promises created in requestParent() */
        this.handleParentResponse = this.handleParentResponse.bind(this);
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('message', this.handleParentResponse);
        }
    }

    /* ADDED: generic helper to wait for parent window response */
    requestParent (action, payload = {}) {
        if (typeof window === 'undefined' || !window.parent) {
            return Promise.reject(new Error('Parent window not available'));
        }
        const uniquePart = (
            Math.random()
                .toString(36)
                .slice(2)
        );
        const requestId = `jupiter-${Date.now()}-${uniquePart}`;
        
        return new Promise((resolve, reject) => {
            Jupiter.pendingRequests[requestId] = {resolve, reject};
            window.parent.postMessage({
                source: 'alpha-iframe',
                action,
                payload,
                requestId
            }, '*');
            // Optional timeout in case parent never replies (30s)
            setTimeout(() => {
                if (Jupiter.pendingRequests[requestId]) {
                    delete Jupiter.pendingRequests[requestId];
                    reject(new Error(`Parent did not respond to ${action}`));
                }
            }, 30000);
        });
    }

    /* ADDED: handle replies coming back from parent */
    handleParentResponse (event) {
        const {data} = event;
        if (!data || data.source !== 'alpha-parent') return;
        const {requestId, result, error} = data;
        const pending = Jupiter.pendingRequests[requestId];
        if (pending) {
            if (error) pending.reject(new Error(error));
            else pending.resolve(result);
            delete Jupiter.pendingRequests[requestId];
        }
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'jupiter',
            name: 'Jupiter',
            color1: '#008080',
            color2: '#008080',
            menuIconURI: MenuiconURI,
            blocks: [
                {
                    opcode: 'sol',
                    blockType: BlockType.REPORTER,
                    text: '[SOLANA] Sol',
                    arguments: {
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: solIconURI
                        }
                    }
                },

                {
                    opcode: 'send',
                    blockType: BlockType.REPORTER,
                    text: '[SOLANA] Send',
                    arguments: {
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: sendIconURI
                        }
                    }
                },

                {
                    opcode: 'fetchPrice',
                    blockType: BlockType.REPORTER,
                    text: '[JUPITER] Fetch price of token [ca]',
                    arguments: {
                        ca: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Contract Address'
                        },
                        JUPITER: {
                            type: ArgumentType.IMAGE,
                            dataURI: JupIconURI
                        }
                    }
                },

                {
                    opcode: 'swapTokenByUser',
                    blockType: BlockType.REPORTER,
                    text: '[JUPITER] Swap [amount] [inputMint] for CA:[ca] by user',
                    arguments: {
                        amount: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        inputMint: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Input Mint'
                        },
                        ca: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Contract Address'
                        },
                        JUPITER: {
                            type: ArgumentType.IMAGE,
                            dataURI: JupIconURI
                        }
                    }
                },

                {
                    opcode: 'stakeByUser',
                    blockType: BlockType.REPORTER,
                    text: '[JUPITER] Stake [amount] Sol for JupSol by user',
                    arguments: {
                        amount: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        JUPITER: {
                            type: ArgumentType.IMAGE,
                            dataURI: JupIconURI
                        }
                    }
                },

                {
                    opcode: 'swapToken',
                    blockType: BlockType.REPORTER,
                    text: '[JUPITER] Swap [amount] [inputMint] for CA:[ca] by [privateKey]',
                    arguments: {
                        privateKey: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Private Key'
                        },
                        amount: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        inputMint: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Input Mint'
                        },
                        ca: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Contract Address'
                        },
                        JUPITER: {
                            type: ArgumentType.IMAGE,
                            dataURI: JupIconURI
                        }
                    }
                },

          
                {
                    opcode: 'stake',
                    blockType: BlockType.REPORTER,
                    text: '[JUPITER] Stake [amount] Sol for JupSol by [privateKey]',
                    arguments: {
                        amount: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        privateKey: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Private Key'
                        },
                        JUPITER: {
                            type: ArgumentType.IMAGE,
                            dataURI: JupIconURI
                        }
                    }
                }

            ],
            menus: {
                networks: {
                    acceptReporters: true,
                    items: ['mainnet-beta', 'devnet', 'testnet']
                }
            }
        };
    }

    sol () {
        return 'So11111111111111111111111111111111111111112';
    }

    send () {
        return 'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa';
    }

    async fetchPrice (args) {
        const ca = args.ca;
        try {
            const response = await fetch(`https://lite-api.jup.ag/price/v3?ids=${ca}`);
            if (!response.ok) {
                return 'Error fetching price';
            }
            const data = await response.json();
            const price = data[ca]?.usdPrice;
            if (!price) {
                return 'Price data not available for the given token.';
            }
            return price;
        } catch (error) {
            console.error(error);
        }
    }

    async swapToken (args) {
        const privateKey = args.privateKey;
        const fromSecretKey = bs58.default.decode(privateKey);
        const fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
        const amount = args.amount;
        const ca = args.ca;
        const inputMint = new web3.PublicKey(args.inputMint);
        const connection = new web3.Connection(Solana.net);
        
        try {
            const outputMint = new web3.PublicKey(ca);
            const isOutputSOL = outputMint.equals(new web3.PublicKey('So11111111111111111111111111111111111111112'));

            if (!isOutputSOL) {
                const outputTokenAddress = await token.getAssociatedTokenAddress(outputMint, fromKeypair.publicKey);
                const outputAtaInfo = await connection.getAccountInfo(outputTokenAddress);
                if (!outputAtaInfo) {
                    console.log('Creating ATA for output token:', outputMint.toString());
                    const txn = new web3.Transaction().add(
                        token.createAssociatedTokenAccountInstruction(
                            fromKeypair.publicKey,
                            outputTokenAddress,
                            fromKeypair.publicKey,
                            outputMint
                        )
                    );
                    await web3.sendAndConfirmTransaction(connection, txn, [fromKeypair]);
                }
            }

            if (!inputMint.equals(new web3.PublicKey('So11111111111111111111111111111111111111112'))) {
                const inputTokenAddress = await token.getAssociatedTokenAddress(inputMint, fromKeypair.publicKey);
                const inputAtaInfo = await connection.getAccountInfo(inputTokenAddress);
                if (!inputAtaInfo) {
                    console.log('Creating ATA for input token:', inputMint.toString());
                    const txn = new web3.Transaction().add(
                        token.createAssociatedTokenAccountInstruction(
                            fromKeypair.publicKey,
                            inputTokenAddress,
                            fromKeypair.publicKey,
                            inputMint
                        )
                    );
                    await web3.sendAndConfirmTransaction(connection, txn, [fromKeypair]);
                }
            }

            const SOL_MINT = new web3.PublicKey('So11111111111111111111111111111111111111112');
            const amountInSmallestUnits = inputMint.equals(SOL_MINT) ?
                amount * web3.LAMPORTS_PER_SOL :
                await this.getTokenAmount(connection, inputMint, amount);

            const quoteResponse = await (await fetch(
                `${JUP_API}/quote?` +
                `inputMint=${inputMint.toString()}` +
                `&outputMint=${outputMint.toString()}` +
                `&amount=${amountInSmallestUnits}` +
                `&slippageBps=300` +
                `&onlyDirectRoutes=true` +
                `&maxAccounts=20`
            )).json();

            const {swapTransaction} = await (await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: fromKeypair.publicKey.toString(),
                    wrapAndUnwrapSol: true,
                    dynamicComputeUnitLimit: true,
                    prioritizationFeeLamports: 'auto'
                })
            })).json();

            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            const transaction = web3.VersionedTransaction.deserialize(swapTransactionBuf);
            transaction.sign([fromKeypair]);
            const signature = await connection.sendTransaction(transaction);
            return signature;
        } catch (error) {
            console.error('Swap error:', error);
            throw new Error(`Swap failed: ${error.message}`);
        }
    }

    async swapTokenByUser (args) {
        const amount = args.amount;
        const ca = args.ca;
        const inputMint = new web3.PublicKey(args.inputMint);
        const connection = new web3.Connection(Solana.net);
        
        // First try parent window
        try {
            const {publicKey} = await this.requestParent('getPublicKey');
            if (publicKey) {
                const userPublicKey = new web3.PublicKey(publicKey);
                const outputMint = new web3.PublicKey(ca);
                
                // Create ATAs if needed
                if (!outputMint.equals(new web3.PublicKey('So11111111111111111111111111111111111111112'))) {
                    const outputTokenAddress = await token.getAssociatedTokenAddress(outputMint, userPublicKey);
                    const outputAtaInfo = await connection.getAccountInfo(outputTokenAddress);
                    if (!outputAtaInfo) {
                        console.log('Creating ATA for output token:', outputMint.toString());
                        const txn = new web3.Transaction().add(
                            token.createAssociatedTokenAccountInstruction(
                                userPublicKey,
                                outputTokenAddress,
                                userPublicKey,
                                outputMint
                            )
                        );
                        txn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                        txn.feePayer = userPublicKey;
                        
                        const {signature} = await this.requestParent('signTransaction', {
                            transaction: txn.serialize().toString('base64'),
                            rpcEndpoint: Solana.net
                        });
                        
                        if (signature) {
                            await connection.sendRawTransaction(Buffer.from(signature, 'base64'));
                        }
                    }
                }

                if (!inputMint.equals(new web3.PublicKey('So11111111111111111111111111111111111111112'))) {
                    const inputTokenAddress = await token.getAssociatedTokenAddress(inputMint, userPublicKey);
                    const inputAtaInfo = await connection.getAccountInfo(inputTokenAddress);
                    if (!inputAtaInfo) {
                        console.log('Creating ATA for input token:', inputMint.toString());
                        const txn = new web3.Transaction().add(
                            token.createAssociatedTokenAccountInstruction(
                                userPublicKey,
                                inputTokenAddress,
                                userPublicKey,
                                inputMint
                            )
                        );
                        txn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                        txn.feePayer = userPublicKey;
                        
                        const {signature} = await this.requestParent('signTransaction', {
                            transaction: txn.serialize().toString('base64'),
                            rpcEndpoint: Solana.net
                        });
                        
                        if (signature) {
                            await connection.sendRawTransaction(Buffer.from(signature, 'base64'));
                        }
                    }
                }

                const SOL_MINT = new web3.PublicKey('So11111111111111111111111111111111111111112');
                const amountInSmallestUnits = inputMint.equals(SOL_MINT) ?
                    amount * web3.LAMPORTS_PER_SOL :
                    await this.getTokenAmount(connection, inputMint, amount);

                const quoteResponse = await (await fetch(
                    `${JUP_API}/quote?` +
                    `inputMint=${inputMint.toString()}` +
                    `&outputMint=${outputMint.toString()}` +
                    `&amount=${amountInSmallestUnits}` +
                    `&slippageBps=300` +
                    `&onlyDirectRoutes=true` +
                    `&maxAccounts=20`
                )).json();

                const {swapTransaction} = await (await fetch('https://quote-api.jup.ag/v6/swap', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        quoteResponse,
                        userPublicKey: userPublicKey.toString(),
                        wrapAndUnwrapSol: true,
                        dynamicComputeUnitLimit: true,
                        prioritizationFeeLamports: 'auto'
                    })
                })).json();

                // Use specific parent action for Jupiter swap
                const {signature} = await this.requestParent('jupiterSwap', {
                    swapTransaction,
                    userPublicKey: userPublicKey.toString(),
                    rpcEndpoint: Solana.net
                });
                
                return signature || null;
            }
        } catch (error) {
            console.log('Parent wallet not available, trying local wallet...');
        }

        // Fallback to local wallet - COMMENTED OUT
        /*
        try {
            const walletAdapters = [
                {name: 'Phantom', adapter: PhantomWalletAdapter},
                {name: 'Backpack', adapter: BackpackWalletAdapter},
                {name: 'Solflare', adapter: SolflareWalletAdapter},
                {name: 'Slope', adapter: SlopeWalletAdapter},
                {name: 'Glow', adapter: GlowWalletAdapter},
                {name: 'Brave', adapter: BraveWalletAdapter}
            ];

            for (const wallet of walletAdapters) {
                try {
                    Solana.wallet = new wallet.adapter();
                    if (!Solana.wallet.connected) {
                        await Solana.wallet.connect();
                    }
                    break;
                } catch (error) {
                    console.log(`${wallet.name} wallet not found, trying next...`);
                }
            }

            if (!Solana.wallet) {
                throw new Error('No supported wallet found. Please install one of the supported wallets.');
            }
            
            const userPublicKey = Solana.wallet.publicKey;
            
            const res = await fetch(
                `https://worker.jup.ag/blinks/swap/So11111111111111111111111111111111111111112/jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v/${amount}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        account: userPublicKey.toString()
                    })
                }
            );
        
            const data = await res.json();
        
            const txn = web3.VersionedTransaction.deserialize(
                Buffer.from(data.transaction, 'base64')
            );
        
            const {blockhash} = await connection.getLatestBlockhash();
            txn.message.recentBlockhash = blockhash;
        
            const signedVersionedTx = await Solana.wallet.signTransaction(txn);
            const signature = await connection.sendTransaction(signedVersionedTx);
        
            const latestBlockhash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            });
        
            return signature;
        } catch (error) {
            console.error('JupSOL staking error:', error);
            return null;
        }
        */
        
        return null;
    }

    async getTokenAmount (connection, mint, amount) {
        try {
            const mintInfo = await token.getMint(connection, mint);
            return amount * Math.pow(10, mintInfo.decimals);
        } catch (error) {
            console.error('Error getting token decimals:', error);
            return amount * Math.pow(10, 9);
        }
    }

    async stake (args) {
        const amount = args.amount;
        const privateKey = args.privateKey;
        const connection = new web3.Connection(Solana.net);
        const fromSecretKey = bs58.default.decode(privateKey);
        const fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
        
        try {
            const walletAdapters = [
                {name: 'Phantom', adapter: PhantomWalletAdapter},
                {name: 'Backpack', adapter: BackpackWalletAdapter},
                {name: 'Solflare', adapter: SolflareWalletAdapter},
                {name: 'Slope', adapter: SlopeWalletAdapter},
                {name: 'Glow', adapter: GlowWalletAdapter},
                {name: 'Brave', adapter: BraveWalletAdapter}
            ];

            for (const wallet of walletAdapters) {
                try {
                    Solana.wallet = new wallet.adapter();
                    if (!Solana.wallet.connected) {
                        await Solana.wallet.connect();
                    }
                    break;
                } catch (error) {
                    console.log(`${wallet.name} wallet not found, trying next...`);
                }
            }

            if (!Solana.wallet) {
                throw new Error('No supported wallet found. Please install one of the supported wallets.');
            }

            const res = await fetch(
                `https://worker.jup.ag/blinks/swap/So11111111111111111111111111111111111111112/jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v/${amount}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        account: fromKeypair.publicKey.toBase58()
                    })
                }
            );
        
            const data = await res.json();
        
            const txn = web3.VersionedTransaction.deserialize(
                Buffer.from(data.transaction, 'base64')
            );
        
            const {blockhash} = await connection.getLatestBlockhash();
            txn.message.recentBlockhash = blockhash;
        
            txn.sign([fromKeypair]);
            const signature = await connection.sendTransaction(txn, {
                preflightCommitment: 'confirmed',
                maxRetries: 3
            });
        
            const latestBlockhash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            });
        
            return signature;
        } catch (error) {
            console.error('JupSOL staking error:', error);
            return null;
        }
    }

    async stakeByUser (args) {
        const amount = args.amount;
        
        // First try parent window
        try {
            const {publicKey} = await this.requestParent('getPublicKey');
            if (publicKey) {
                const userPublicKey = new web3.PublicKey(publicKey);
                
                const res = await fetch(
                    `https://worker.jup.ag/blinks/swap/So11111111111111111111111111111111111111112/jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v/${amount}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            account: userPublicKey.toString()
                        })
                    }
                );
            
                const data = await res.json();
            
                // Use specific parent action for Jupiter stake
                const {signature} = await this.requestParent('jupiterStake', {
                    transaction: data.transaction,
                    userPublicKey: userPublicKey.toString(),
                    rpcEndpoint: Solana.net
                });
                
                if (signature) {
                    return signature;
                }
            }
        } catch (error) {
            console.log('Parent wallet not available, trying local wallet...');
        }

        // Fallback to local wallet - COMMENTED OUT
        /*
        try {
            const walletAdapters = [
                {name: 'Phantom', adapter: PhantomWalletAdapter},
                {name: 'Backpack', adapter: BackpackWalletAdapter},
                {name: 'Solflare', adapter: SolflareWalletAdapter},
                {name: 'Slope', adapter: SlopeWalletAdapter},
                {name: 'Glow', adapter: GlowWalletAdapter},
                {name: 'Brave', adapter: BraveWalletAdapter}
            ];

            for (const wallet of walletAdapters) {
                try {
                    Solana.wallet = new wallet.adapter();
                    if (!Solana.wallet.connected) {
                        await Solana.wallet.connect();
                    }
                    break;
                } catch (error) {
                    console.log(`${wallet.name} wallet not found, trying next...`);
                }
            }

            if (!Solana.wallet) {
                throw new Error('No supported wallet found. Please install one of the supported wallets.');
            }
            
            const userPublicKey = Solana.wallet.publicKey;
            
            const res = await fetch(
                `https://worker.jup.ag/blinks/swap/So11111111111111111111111111111111111111112/jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v/${amount}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        account: userPublicKey.toString()
                    })
                }
            );
        
            const data = await res.json();
        
            const txn = web3.VersionedTransaction.deserialize(
                Buffer.from(data.transaction, 'base64')
            );
        
            const {blockhash} = await connection.getLatestBlockhash();
            txn.message.recentBlockhash = blockhash;
        
            const signedVersionedTx = await Solana.wallet.signTransaction(txn);
            const signature = await connection.sendTransaction(signedVersionedTx);
        
            const latestBlockhash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            });
        
            return signature;
        } catch (error) {
            console.error('JupSOL staking error:', error);
            return null;
        }
        */

        return null;
    }

}

module.exports = Jupiter;
