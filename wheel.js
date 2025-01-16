class WheelEditor {
    constructor() {
        this.spaces = [
            {
                name: "Take 1",
                color: this.getDefaultColor(0),
                bias: 1.0,
                hasCustomColor: false,
                customColor: '#000000'
            },
            {
                name: "Take 2",
                color: this.getDefaultColor(1),
                bias: 0.5,
                hasCustomColor: false,
                customColor: '#000000'
            },
            {
                name: "Give 2",
                color: this.getDefaultColor(2),
                bias: 1,
                hasCustomColor: false,
                customColor: '#000000'
            },
            {
                name: "Spin Again",
                color: this.getDefaultColor(3),
                bias: 0.7,
                hasCustomColor: false,
                customColor: '#000000'
            },
            {
                name: "Water Shot",
                color: this.getDefaultColor(4),
                bias: 0.5,
                hasCustomColor: false,
                customColor: '#000000'
            },
            {
                name: "Pick a Mate",
                color: this.getDefaultColor(5),
                bias: 1.0,
                hasCustomColor: false,
                customColor: '#000000'
            }
        ];
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.arrowRotation = 0;
        this.setupEventListeners();
        this.initializeSortable();
        
        // Add theme color change handler
        document.getElementById('themeColor').addEventListener('input', () => {
            this.updateSpaceColors();
            this.updateWheel();
        });

        // Set default order type
        document.getElementById('orderType').value = 'sequence';
        
        // Initialize the wheel with default spaces
        this.renderSpacesList();
        this.updateWheel();
        this.updateConfigDisplay();

        // Add import configuration handler
        document.getElementById('importConfig').addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('importModal'));
            modal.show();
        });

        document.getElementById('importButton').addEventListener('click', () => this.importConfiguration());

        // Add copy configuration handler
        document.getElementById('copyConfig').addEventListener('click', () => {
            const configText = document.getElementById('exportedConfig').textContent;
            navigator.clipboard.writeText(configText).then(() => {
                const btn = document.getElementById('copyConfig');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span>Copied!</span>';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            });
        });

        // Initialize tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    setupEventListeners() {
        document.getElementById('addSpace').addEventListener('click', () => this.addSpace());
        document.getElementById('exportConfig').addEventListener('click', () => this.exportConfiguration());
        document.getElementById('spinButton').addEventListener('click', () => this.spin());
        ['wheelName', 'themeColor', 'orderType'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateWheel());
        });
    }

    initializeSortable() {
        new Sortable(document.getElementById('spacesList'), {
            animation: 300,
            handle: '.space-handle',
            forceFallback: true,
            fallbackClass: 'sortable-fallback',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: (evt) => {
                const space = this.spaces.splice(evt.oldIndex, 1)[0];
                this.spaces.splice(evt.newIndex, 0, space);
                this.updateSpaceColors();
                this.renderSpacesList();
                this.updateWheel();
            }
        });
    }

    addSpace() {
        const space = {
            name: 'New Space',
            color: this.getDefaultColor(this.spaces.length),
            bias: 1.0,
            hasCustomColor: false,
            customColor: '#000000'
        };
        this.spaces.push(space);
        this.renderSpacesList();
        this.updateWheel();
    }

    getDefaultColor(index) {
        return index % 2 === 0 ? document.getElementById('themeColor').value : '#000000';
    }

    updateSpaceColors() {
        this.spaces.forEach((space, index) => {
            if (!space.hasCustomColor) {
                space.color = this.getDefaultColor(index);
                space.customColor = space.color; // Keep custom color in sync
            }
        });
    }

    getRarityLabel(bias) {
        if (bias <= 0.25) return 'Very Rare';
        if (bias <= 0.5) return 'Rare';
        if (bias <= 1.0) return 'Normal';
        if (bias <= 1.5) return 'Common';
        return 'Very Common';
    }

    getRarityClass(bias) {
        return 'rarity-label'; // Just return a single class for styling
    }

    renderSpacesList() {
        const container = document.getElementById('spacesList');
        container.innerHTML = this.spaces.map((space, index) => `
            <div class="space-item" data-index="${index}">
                <div class="space-header">
                    <span class="space-handle">☰</span>
                    <input type="text" class="form-control" value="${space.name}" 
                        oninput="wheelEditor.updateSpaceName(${index}, this.value)"
                        placeholder="Space name">
                    <button class="btn btn-danger btn-delete" onclick="wheelEditor.deleteSpace(${index})">×</button>
                </div>
                <div class="space-controls">
                    <div class="color-control">
                        <div class="color-header">
                            <span>Color</span>
                        </div>
                        <div class="color-inputs">
                            <input type="color" class="form-control form-control-color" 
                                value="${space.hasCustomColor ? space.customColor : space.color}"
                                oninput="wheelEditor.updateSpaceColor(${index}, this.value)"
                                ${!space.hasCustomColor ? 'disabled' : ''}
                                title="Choose space color">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" 
                                    ${space.hasCustomColor ? 'checked' : ''}
                                    onchange="wheelEditor.toggleCustomColor(${index}, this.checked)"
                                    id="customColor${index}">
                                <label class="form-check-label" for="customColor${index}">Use Custom Color</label>
                            </div>
                        </div>
                    </div>
                    <div class="bias-section">
                        <div class="bias-header">
                            <span>Probability</span>
                            <span class="${this.getRarityClass(space.bias)}">${this.getRarityLabel(space.bias)}</span>
                        </div>
                        <div class="bias-controls">
                            <input type="range" class="form-range" value="${space.bias}" min="0.1" max="2" step="0.1"
                                oninput="wheelEditor.updateSpaceBias(${index}, this.value, 'slider')"
                                title="Adjust probability">
                            <input type="number" class="form-control bias-number" value="${space.bias}" step="0.1" min="0.1"
                                oninput="wheelEditor.updateSpaceBias(${index}, this.value, 'number')"
                                title="Custom probability value">
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    toggleCustomColor(index, enabled) {
        const space = this.spaces[index];
        space.hasCustomColor = enabled;
        if (enabled) {
            // Keep the current color when enabling custom colors
            space.customColor = space.color;
        } else {
            space.color = this.getDefaultColor(index);
            space.customColor = space.color; // Keep custom color in sync with default
        }
        this.renderSpacesList();
        this.updateWheel();
    }

    updateSpaceName(index, value) {
        this.spaces[index].name = value;
        this.updateWheel();
        this.updateConfigDisplay(); // Add config update
    }

    updateSpaceColor(index, value) {
        const space = this.spaces[index];
        space.customColor = value;
        if (space.hasCustomColor) {
            space.color = value;
        }
        this.updateWheel();
    }

    updateSpaceBias(index, value, source) {
        const numValue = parseFloat(value);
        this.spaces[index].bias = numValue;
        
        // Update the other input if needed
        const spaceItem = document.querySelector(`[data-index="${index}"]`);
        if (source === 'slider') {
            spaceItem.querySelector('.bias-number').value = numValue;
        } else {
            spaceItem.querySelector('.form-range').value = numValue;
        }
        
        // Update the rarity label
        const raritySpan = spaceItem.querySelector('.bias-header span:last-child');
        raritySpan.className = this.getRarityClass(numValue);
        raritySpan.textContent = this.getRarityLabel(numValue);
        
        this.updateWheel();
    }

    deleteSpace(index) {
        this.spaces.splice(index, 1);
        this.renderSpacesList();
        this.updateWheel();
    }

    generateRandomColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16);
    }

    updateWheel() {
        this.canvas.width = 500;
        this.canvas.height = 500;
        if (this.spaces.length === 0) return;
        this.drawWheel();
        this.updateConfigDisplay(); // Add config update
    }

    getContrastColor(hexcolor) {
        // Convert hex to RGB
        const r = parseInt(hexcolor.slice(1,3), 16);
        const g = parseInt(hexcolor.slice(3,5), 16);
        const b = parseInt(hexcolor.slice(5,7), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black or white based on luminance
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    calculateFontSize(ctx, text, maxWidth, defaultSize = 24) {
        let fontSize = defaultSize;
        ctx.font = `${fontSize}px Arial`;
        let textWidth = ctx.measureText(text).width;
        
        // Scale down if text is too wide
        if (textWidth > maxWidth) {
            fontSize *= maxWidth / textWidth;
        }
        
        return Math.max(12, Math.min(24, fontSize)); // Clamp between 12 and 24
    }

    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        const totalWeight = this.spaces.reduce((sum, space) => sum + space.bias, 0);
        let currentAngle = 0;

        this.spaces.forEach(space => {
            const sliceAngle = (space.bias / totalWeight) * Math.PI * 2;
            
            // Draw slice
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            this.ctx.closePath();
            
            this.ctx.fillStyle = space.color;
            this.ctx.fill();
            this.ctx.stroke();

            // Calculate optimal font size and color
            const maxWidth = radius * 0.8; // 80% of radius for text
            const fontSize = this.calculateFontSize(this.ctx, space.name, maxWidth);
            const textColor = this.getContrastColor(space.color);

            // Add text
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(currentAngle + sliceAngle/2);
            this.ctx.textAlign = "right";
            this.ctx.textBaseline = "middle";
            this.ctx.font = `${fontSize}px Arial`;
            this.ctx.fillStyle = textColor;
            
            // Add text with a small outline for better readability
            this.ctx.strokeStyle = textColor === '#000000' ? '#FFFFFF' : '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(space.name, radius - 20, 0);
            this.ctx.fillText(space.name, radius - 20, 0);
            
            this.ctx.restore();

            currentAngle += sliceAngle;
        });
    }

    updateConfigDisplay() {
        const config = [
            `Name=${document.getElementById('wheelName').value}`,
            `Theme=${document.getElementById('themeColor').value}`,
            `Order=${document.getElementById('orderType').value}`,
            '',
            ...this.spaces.map(space => {
                let result = space.name;
                if (space.bias !== 1) result += `/bias=${space.bias}`;
                if (space.hasCustomColor) result += `/Color=${space.color}`;
                return result;
            })
        ].join('\n');

        document.getElementById('exportedConfig').textContent = config;
    }

    async createPaste(content) {
        const API_KEY = 'cDvgp7RpQro-CszpMvC1lK-Ad4VdFf4j'; // I know it's here shhh
        const data = new URLSearchParams({
            'api_dev_key': API_KEY,
            'api_option': 'paste',
            'api_paste_code': content,
            'api_paste_name': document.getElementById('wheelName').value,
            'api_paste_private': '1', // 0=public, 1=unlisted, 2=private
            'api_paste_expire_date': 'N' // N = Never expire
        });

        try {
            const response = await fetch('https://pastebin.com/api/api_post.php', {
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (!response.ok) throw new Error('Failed to create paste');
            const pasteUrl = await response.text();
            // Convert regular URL to raw URL
            return pasteUrl.replace('pastebin.com/', 'pastebin.com/raw/');
        } catch (error) {
            console.error('Pastebin error:', error);
            return null;
        }
    }

    async exportConfiguration() {
        const exportBtn = document.getElementById('exportConfig');
        const shareLinkDiv = document.getElementById('shareLink');
        const originalText = "Generate a link";  // Update default text
        exportBtn.disabled = true;
        exportBtn.textContent = 'Creating paste...';
        shareLinkDiv.innerHTML = '';

        const config = document.getElementById('exportedConfig').textContent;
        const pasteUrl = await this.createPaste(config);

        if (pasteUrl) {
            // Copy the Pastebin URL to clipboard
            navigator.clipboard.writeText(pasteUrl).then(() => {
                exportBtn.textContent = 'Copied link!';
                // Add the URL to a separate div
                shareLinkDiv.innerHTML = `
                    <div class="alert alert-success">
                        Share link: <a href="${pasteUrl}" target="_blank">${pasteUrl}</a>
                    </div>`;
            }).catch(err => {
                exportBtn.textContent = 'Link created!';
            });
        } else {
            exportBtn.textContent = 'Error - Try again';
        }

        setTimeout(() => {
            exportBtn.disabled = false;
            exportBtn.textContent = originalText;
        }, 2000);
    }

    async importConfiguration() {
        const input = document.getElementById('importInput').value.trim();
        let configText = input;

        // Check if input is a Pastebin URL
        if (input.includes('pastebin.com')) {
            try {
                let url = input;
                if (!url.includes('/raw/')) {
                    url = url.replace('pastebin.com/', 'pastebin.com/raw/');
                }
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                configText = await response.text();
            } catch (error) {
                console.error('Import error:', error);
                alert('Failed to load from Pastebin. Please copy and paste the configuration text directly.');
                return;
            }
        }

        try {
            // Split into sections (header and spaces)
            const sections = configText.split('\n\n');
            const headerSection = sections[0];
            const spacesSection = sections[1];

            // Parse header
            const config = {};
            headerSection.split('\n').forEach(line => {
                if (line.includes('=')) {
                    const [key, value] = line.split('=');
                    config[key] = value;
                }
            });

            // Parse spaces
            const spaces = [];
            if (spacesSection) {
                spacesSection.split('\n').forEach(line => {
                    if (line.trim()) {
                        const parts = line.split('/');
                        const space = {
                            name: parts[0],
                            color: this.getDefaultColor(spaces.length),
                            bias: 1.0,
                            hasCustomColor: false,
                            customColor: '#000000'
                        };

                        // Parse additional properties
                        for (let i = 1; i < parts.length; i++) {
                            const [key, value] = parts[i].split('=');
                            if (key === 'bias') {
                                space.bias = parseFloat(value);
                            } else if (key === 'Color') {
                                space.color = value;
                                space.hasCustomColor = true;
                                space.customColor = value;
                            }
                        }

                        spaces.push(space);
                    }
                });
            }

            // Apply configuration
            if (config.Name) document.getElementById('wheelName').value = config.Name;
            if (config.Theme) {
                document.getElementById('themeColor').value = config.Theme;
                this.updateSpaceColors(); // Update default colors based on new theme
            }
            if (config.Order) document.getElementById('orderType').value = config.Order;

            this.spaces = spaces;
            this.renderSpacesList();
            this.updateWheel();

            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();
            document.getElementById('importInput').value = '';

        } catch (error) {
            console.error('Parse error:', error);
            alert('Failed to parse configuration. Please check the format and try again.');
        }
    }

    generateThemeColor() {
        return document.getElementById('themeColor').value;
    }

    spin() {
        if (this.isSpinning || this.spaces.length === 0) return;
        this.isSpinning = true;

        const totalRotation = 3600 + Math.random() * 360;
        const duration = 5000;
        const startTime = performance.now();
        const startRotation = this.arrowRotation;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            this.arrowRotation = startRotation + (totalRotation * easeOut);

            // Update arrow rotation with corrected transform
            const arrow = document.querySelector('.wheel-arrow');
            arrow.style.transform = `translate(-50%, -50%) rotate(${this.arrowRotation}deg)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
            }
        };

        requestAnimationFrame(animate);
    }
}

const wheelEditor = new WheelEditor();
