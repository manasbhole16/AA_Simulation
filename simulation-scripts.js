document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const numNodesInput = document.getElementById('numNodes');
    const setNodesButton = document.getElementById('setNodes');
    const sourceInput = document.getElementById('source');
    const destinationInput = document.getElementById('destination');
    const weightInput = document.getElementById('weight');
    const addEdgeButton = document.getElementById('addEdge');
    const clearEdgesButton = document.getElementById('clearEdges');
    const loadExampleButton = document.getElementById('loadExample');
    const runAlgorithmButton = document.getElementById('runAlgorithm');
    const nextStepButton = document.getElementById('nextStep');
    const resetButton = document.getElementById('resetVisualization');
    const stepsContainer = document.getElementById('steps');
    const resultContainer = document.getElementById('result');
    const resultDetails = document.getElementById('resultDetails');
    const totalWeightElement = document.getElementById('totalWeight');
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');
    
    // Graph data
    let numNodes = parseInt(numNodesInput.value);
    let edges = [];
    let nodes = [];
    let mst = [];
    let sortedEdges = [];
    let currentStep = 0;
    let disjointSet = [];
    let stepByStepMode = false;
    
    // Initialize nodes positions
    function initializeNodes() {
        nodes = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.4 - 30;
        
        for (let i = 0; i < numNodes; i++) {
            const angle = (i * 2 * Math.PI / numNodes) - Math.PI/2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            nodes.push({ id: i, x, y });
        }
    }
    
    // Set the number of nodes
    setNodesButton.addEventListener('click', function() {
        numNodes = parseInt(numNodesInput.value);
        if (numNodes < 2) {
            alert("Number of nodes must be at least 2");
            numNodesInput.value = 2;
            numNodes = 2;
        } else if (numNodes > 15) {
            alert("For clarity, maximum number of nodes is limited to 15");
            numNodesInput.value = 15;
            numNodes = 15;
        }
        
        // Update max values for source and destination inputs
        sourceInput.max = numNodes - 1;
        destinationInput.max = numNodes - 1;
        
        // Reset edges if they reference nodes that no longer exist
        edges = edges.filter(edge => 
            edge.source < numNodes && edge.destination < numNodes);
        
        initializeNodes();
        drawGraph();
    });
    
    // Add edge to the graph
    addEdgeButton.addEventListener('click', function() {
        const source = parseInt(sourceInput.value);
        const destination = parseInt(destinationInput.value);
        const weight = parseInt(weightInput.value);
        
        if (isNaN(source) || isNaN(destination) || isNaN(weight)) {
            alert("Please fill all fields with valid numbers.");
            return;
        }
        
        if (source < 0 || source >= numNodes || destination < 0 || destination >= numNodes) {
            alert(`Node IDs must be between 0 and ${numNodes - 1}`);
            return;
        }
        
        if (source === destination) {
            alert("Self-loops are not allowed in a minimum spanning tree");
            return;
        }
        
        if (weight <= 0) {
            alert("Weight must be a positive number");
            return;
        }
        
        // Check if edge already exists
        const edgeExists = edges.some(edge => 
            (edge.source === source && edge.destination === destination) || 
            (edge.source === destination && edge.destination === source)
        );
        
        if (edgeExists) {
            alert("This edge already exists. Edit or remove it first.");
            return;
        }
        
        edges.push({ source, destination, weight });
        
        // Clear inputs
        sourceInput.value = '';
        destinationInput.value = '';
        weightInput.value = '';
        
        drawGraph();
    });
    
    // Clear all edges
    clearEdgesButton.addEventListener('click', function() {
        edges = [];
        drawGraph();
        resetVisualization();
    });
    
    // Load example graph
    loadExampleButton.addEventListener('click', function() {
        numNodes = 5;
        numNodesInput.value = 5;
        sourceInput.max = 4;
        destinationInput.max = 4;
        
        edges = [
            { source: 0, destination: 1, weight: 2 },
            { source: 0, destination: 3, weight: 6 },
            { source: 1, destination: 2, weight: 3 },
            { source: 1, destination: 3, weight: 8 },
            { source: 1, destination: 4, weight: 5 },
            { source: 2, destination: 4, weight: 7 },
            { source: 3, destination: 4, weight: 9 }
        ];
        
        initializeNodes();
        drawGraph();
        resetVisualization();
    });
    
    // Run Kruskal's algorithm
    runAlgorithmButton.addEventListener('click', function() {
        if (edges.length === 0) {
            alert("Please add some edges first");
            return;
        }
        
        resetVisualization();
        runKruskal(false);
        drawGraph();
    });
    
    // Next step in visualization
    nextStepButton.addEventListener('click', function() {
        if (currentStep < sortedEdges.length) {
            kruskalStep();
            drawGraph();
        } else {
            nextStepButton.disabled = true;
            finishVisualization();
        }
    });
    
    // Reset visualization
    resetButton.addEventListener('click', function() {
        resetVisualization();
        drawGraph();
    });
    
    // Reset visualization state
    function resetVisualization() {
        mst = [];
        sortedEdges = [];
        currentStep = 0;
        disjointSet = [];
        stepsContainer.innerHTML = '<p>Steps will appear here after running the algorithm.</p>';
        resultContainer.style.display = 'none';
        nextStepButton.disabled = true;
        resetButton.disabled = true;
    }
    
    // Initialize disjoint-set data structure
    function makeSet(n) {
        disjointSet = Array.from({ length: n }, (_, i) => i);
    }
    
    // Find operation with path compression
    function find(x) {
        if (disjointSet[x] !== x) {
            disjointSet[x] = find(disjointSet[x]);
        }
        return disjointSet[x];
    }
    
    // Union operation
    function union(x, y) {
        const rootX = find(x);
        const rootY = find(y);
        disjointSet[rootY] = rootX;
    }
    
    // Run Kruskal's algorithm
    function runKruskal(stepByStep) {
        stepByStepMode = stepByStep;
        
        // Reset
        mst = [];
        disjointSet = [];
        makeSet(numNodes);
        
        // Sort edges by weight
        sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
        
        stepsContainer.innerHTML = `<h3>Algorithm Steps:</h3>`;
        stepsContainer.innerHTML += `<div class="step">Sorted edges by weight: ${sortedEdges.map(e => `(${e.source},${e.destination},${e.weight})`).join(', ')}</div>`;
        
        if (stepByStep) {
            currentStep = 0;
            nextStepButton.disabled = false;
            resetButton.disabled = false;
        } else {
            // Run the entire algorithm at once
            for (const edge of sortedEdges) {
                const sourceRoot = find(edge.source);
                const destRoot = find(edge.destination);
                
                if (sourceRoot !== destRoot) {
                    mst.push(edge);
                    union(sourceRoot, destRoot);
                    
                    // Add step to UI
                    stepsContainer.innerHTML += `
                        <div class="step">
                            Consider edge (${edge.source},${edge.destination}) with weight ${edge.weight}: 
                            <span style="color:green">Added</span> to MST (no cycle formed)
                        </div>
                    `;
                } else {
                    stepsContainer.innerHTML += `
                        <div class="step">
                            Consider edge (${edge.source},${edge.destination}) with weight ${edge.weight}: 
                            <span style="color:red">Rejected</span> (would form a cycle)
                        </div>
                    `;
                }
            }
            
            finishVisualization();
            resetButton.disabled = false;
        }
    }
    
    // Execute a single step of Kruskal's algorithm
    function kruskalStep() {
        if (currentStep === 0) {
            nextStepButton.disabled = false;
        }
        
        if (currentStep < sortedEdges.length) {
            const edge = sortedEdges[currentStep];
            const sourceRoot = find(edge.source);
            const destRoot = find(edge.destination);
            
            let stepElement = document.createElement('div');
            stepElement.className = 'step highlighted';
            
            if (sourceRoot !== destRoot) {
                mst.push(edge);
                union(sourceRoot, destRoot);
                
                stepElement.innerHTML = `
                    Consider edge (${edge.source},${edge.destination}) with weight ${edge.weight}: 
                    <span style="color:green">Added</span> to MST (no cycle formed)
                `;
            } else {
                stepElement.innerHTML = `
                    Consider edge (${edge.source},${edge.destination}) with weight ${edge.weight}: 
                    <span style="color:red">Rejected</span> (would form a cycle)
                `;
            }
            
            stepsContainer.appendChild(stepElement);
            stepElement.scrollIntoView({ behavior: "smooth" });
            
            currentStep++;
            
            // Remove highlighting from previous step
            setTimeout(() => {
                stepElement.className = 'step';
            }, 1500);
        }
        
        if (currentStep >= sortedEdges.length) {
            finishVisualization();
        }
    }
    
    // Finish the visualization and show results
    function finishVisualization() {
        resultContainer.style.display = 'block';
        
        let totalWeight = mst.reduce((sum, edge) => sum + edge.weight, 0);
        
        resultDetails.innerHTML = `
            <p>Edges in MST: ${mst.map(e => `(${e.source},${e.destination}) with weight ${e.weight}`).join(', ')}</p>
        `;
        totalWeightElement.textContent = `Total MST Weight: ${totalWeight}`;
        
        drawGraph();
    }
    
    // Draw the graph on canvas
    function drawGraph() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw edges
        edges.forEach(edge => {
            const sourceNode = nodes[edge.source];
            const destNode = nodes[edge.destination];
            
            // Check if this edge is in MST
            const inMST = mst.some(e => 
                (e.source === edge.source && e.destination === edge.destination) ||
                (e.source === edge.destination && e.destination === edge.source)
            );
            
            // Check if this is the current edge being considered in step by step mode
            const isCurrent = stepByStepMode && currentStep > 0 && currentStep <= sortedEdges.length && 
                edge.source === sortedEdges[currentStep-1].source && 
                edge.destination === sortedEdges[currentStep-1].destination;
            
            // Set line style based on edge status
            ctx.lineWidth = inMST ? 3 : 1;
            ctx.strokeStyle = inMST ? '#4CAF50' : (isCurrent ? '#FFC107' : '#999');
            
            // Draw edge
            ctx.beginPath();
            ctx.moveTo(sourceNode.x, sourceNode.y);
            ctx.lineTo(destNode.x, destNode.y);
            ctx.stroke();
            
            // Draw weight
            const midX = (sourceNode.x + destNode.x) / 2;
            const midY = (sourceNode.y + destNode.y) / 2;
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = inMST ? '#4CAF50' : (isCurrent ? '#FFC107' : '#333');
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edge.weight, midX, midY);
        });
        
        // Draw nodes
        nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
            ctx.fillStyle = '#2a5885';
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.id, node.x, node.y);
        });
    }
    
    // Initialize
    initializeNodes();
    drawGraph();
    
    // Enable step-by-step mode button
    document.getElementById('nextStep').addEventListener('click', function() {
        if (!stepByStepMode && edges.length > 0) {
            resetVisualization();
            runKruskal(true);
            stepByStepMode = true;
        }
    });
    
    // Run step-by-step visualization
    document.getElementById('runAlgorithm').addEventListener('click', function() {
        if (edges.length === 0) {
            alert("Please add some edges first");
            return;
        }
        
        resetVisualization();
        runKruskal(false);
        drawGraph();
        resetButton.disabled = false;
    });
});