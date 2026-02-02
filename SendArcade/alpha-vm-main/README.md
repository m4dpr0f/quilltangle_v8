
# Alpha
Alpha is a low code tool built by Send Arcade to empower everyone to create interactive applications on the Solana Blockchain with ease. Inspired by MIT's Scratch and built on the robust foundation of Google Blockly, Alpha provides an intuitive visual programming interface for both beginners and advanced users. This is so simple that even kids can use this. This is the Virtual machine repository of the tool.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
- [Usage](#usage)
- [Contributing](#contributing)
  - [Contribution Guidelines](#contribution-guidelines)
- [Add new blocks/ Integrate new protocol](#add-new-blocks/-integrate-new-protocol)
- [Roadmap](#roadmap)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

## Features

- **Visual Programming:** Drag and drop blocks to build your application logic.
- **User-Friendly Interface:** Inspired by Scratch’s simplicity and clarity.
- **Extensible:** Easily add new blocks and features.
- **Cross-Platform:** Works in all major modern browsers.

## Getting Started

Follow these instructions to set up Alpha on your local machine for development and testing.

### Prerequisites

- **npm** (v6 or higher)
- A modern web browser (Chrome, Firefox, etc.)

### Local Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/SendArcade/alpha-vm
   cd alpha-vm
   ```

2. **Install Dependencies**

   Using npm:

   ```bash
   npm install
   ```

3. **Start the Development Server**

   ```bash
   npm run start
   ```

   Then Alpha-vm will be hosted on [http://0.0.0.0:8073/](http://0.0.0.0:8073/). 

4. **Integrate with Alpha-gui**
In the alpha-vm repository run
  ```bash
    npm run watch
  ```
  Use this to run the project in development mode.
  Make sure that alpha-vm and alpha-gui are in the same folder.
  Then in the alpha-gui repo run 
  ```bash
    npm link alpha-vm
  ```
  Then run the below command in the alpha-gui repo to run the development environment.
  ```bash
    npm run start
  ```
  More on this in the [alpha-gui](https://github.com/SendArcade/alpha-gui) repository.
## Usage

Alpha leverages Google Blockly to provide a visual programming experience. Drag blocks from the sidebar into the workspace, connect them to define logic, and run your code directly in the browser. Detailed usage instructions and examples are provided in the [docs](docs/usage.md).

## Contributing

We welcome contributions from the community! Here’s how you can get involved.

### Contribution Guidelines

1. **Fork the Repository:** Click on the fork button at the top right of the GitHub page.
2. **Create a New Branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit Your Changes:**

   ```bash
   git commit -m "Add: description of your feature"
   ```

4. **Push to Your Branch:**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request:** Submit a pull request describing your changes and why they should be merged.

Please ensure your pull request adheres to our code style and passes all tests.

## Add new blocks/ Integrate new protocol
You can add new protoccols by defining their blocks and functions here in the alpha-vm repository and then adding them in the default project of the alpha-gui repository.
It will be in the 
```bash
src/blocks/protocolName.js
```
The sample code for a new protcol will be as below:
```js
const BlockType = require('../extension-support/block-type');
const ArgumentType = require('../extension-support/argument-type');
const bs58 = require('bs58');
const web3 = require('@solana/web3.js');
const Solana = require('./solana'); 
// Define the imports like this. If you are using a new package you might need to define its specific webpack configurations to make them compatible. We are working to have this ported to the latest version to avoid these issues.

// The below images will be base64 encoded only else they won't work. SVG files are preferred, if not available then PNG files can be used.
// You can use the below links to convert your images to base64 encoding 
// https://www.fffuel.co/eeencode/
// https://www.site24x7.com/tools/image-to-datauri.html

// eslint-disable-next-line max-len
const ProtocolIconURI = ''; // Will be used as an inline image for the blocks. (Can be multiple as per requirements)
// eslint-disable-next-line max-len
const MenuiconURI = ``; // Will be used as a Menu icon.

class Protocol {
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
            id: 'protocol', // to be used in alpha-gui
            name: 'Protocol', // will be visible in the Menu
            color1: '#008080', // default block colour
            color2: '#008080', // if no menu icon url is defined, the colour1 will be used and colour 2 will be used at outline
            menuIconURI: MenuiconURI, // menu icon
            blocks: [
                {
                    opcode: 'functionName',
                    blockType: BlockType.REPORTER, // can be 
                                                    // const BlockType: {
                                                    // BOOLEAN: string;
                                                    // BUTTON: string;
                                                    // LABEL: string;
                                                    // COMMAND: string;
                                                    // CONDITIONAL: string;
                                                    // EVENT: string;
                                                    // HAT: string;
                                                    // LOOP: string;
                                                    // REPORTER: string;
                                                    // XML: string;
                                                // } 
                                                // More on this in the contribution guide.
                    text: '[PROTOCOL] Text',
                    arguments: {
                        PROTCOL: {
                            type: ArgumentType.IMAGE,
                            dataURI: PROTOCOLIconURI
                        }
                    }
                },
            ],
        };
    }
    async functionName (args) {
      console.log("Success");
    }
}

module.exports = Protocol;

```

Now in the alpha-gui repo edit the default project to add your protocol there so that it loads by default.
Go to the file:
```bash
  src/lib/default-project/project-data.js
```
And add the below snippet to your need in the blocks:
```js
protocol: {
          opcode: 'protocol_enableProtocol',
          next: null,
          parent: null,
          inputs: {},
          fields: {},
          shadow: true,
          topLevel: true,
          x: 0,
          y: 0
        },
```
More on how to make these in the contribution guide.

## Roadmap

- [ ] Improve and expand documentation.
- [ ] Develop additional sample projects.
- [ ] Integrate more advanced Solana protocols.
- [ ] Optimize performance for low-end devices.
- [ ] Expand community plugins and extensions.

## License

Alpha is licensed under the MPL-2.0. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- **Scratch** by MIT – for inspiring the low code, visual programming approach.
- **Google Blockly** – for providing the robust foundation of block-based programming.
- All our contributors and the open-source community for their support and collaboration.

## Contact

For questions or suggestions, please open an issue in this repository or contact the maintainers at [Alpha Contributors Telegram Group](https://t.me/+1oBJOPTg0VQ0Njll).
