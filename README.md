# Audio Node Editor

A web-based modular audio processing application built with Next.js, React, TypeScript, and Tailwind CSS.

![Audio Node Editor Screenshot](public/placeholder.svg)

## Overview

Audio Node Editor is a visual interface for creating audio processing chains using a node-based editor. Connect different audio processing nodes together to create complex audio effects and visualizations.

## Features

- **Visual Node Editor**: Drag and drop interface for connecting audio nodes
- **Multiple Node Types**: Source, destination, delay, reverb, compressor, filter, visualizer, and parametric EQ
- **Real-time Parameter Control**: Adjust node parameters with intuitive controls
- **Context Menu**: Right-click to add nodes and perform other operations
- **Dark/Light Mode**: Theme support for different visual preferences
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v18.17.0 or higher)
- npm or pnpm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/audio-node-editor.git
   cd audio-node-editor
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Adding Nodes

- Click on a node type in the sidebar to add it to the canvas
- Drag nodes from the sidebar to position them precisely
- Right-click on the canvas to open the context menu for adding nodes

### Connecting Nodes

- Click on an output connector (right side of a node) to start a connection
- Click on an input connector (left side of a node) to complete the connection
- Click on an existing connection to delete it

### Adjusting Parameters

- Select a node to view and adjust its parameters in the control panel
- Different node types have different parameters that affect the audio processing

### Keyboard Shortcuts

- `Delete`: Remove selected node
- `Escape`: Close context menu

## Project Structure

- `/app`: Next.js application routing and pages
- `/components`: React components organized by function
- `/lib`: Utility functions and tools
- `/public`: Static assets like images and SVGs
- `/styles`: Global CSS styles

### Key Components

- `AudioNodeProvider`: Context provider for audio node management and connections
- `NodeEditor`: Main canvas where nodes are placed and connected
- `ControlPanel`: Parameter controls for selected nodes
- `Sidebar`: Node selection and application controls

## Technologies

- [Next.js](https://nextjs.org/) - React framework
- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components
- [Lucide Icons](https://lucide.dev/) - Icon set
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Audio processing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for audio processing capabilities
- [shadcn/ui](https://ui.shadcn.com/) for the UI component library
- All contributors who have helped improve this project