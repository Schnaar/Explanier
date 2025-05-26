// Create the context menu



chrome.contextMenus.removeAll(() => {
chrome.contextMenus.create({
    id: "eli5",
    title: "Explain this text",
    contexts: ["selection"]
  });
});

  // Handle menu clicks
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "eli5" && info.selectionText) {
      try {
        // Show loading indicator
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'eli5-loading';
            loadingDiv.innerHTML = `
              <div class="eli5-container">
                <div class="eli5-header">
                  <img src="${chrome.runtime.getURL('explain_icon.png')}" class="eli5-logo" alt="ELI5 Logo">
                  <h3>Simplifying for you...</h3>
                </div>
                <div class="eli5-loader"></div>
              </div>
            `;
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
              .eli5-container {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                padding: 20px;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                z-index: 9999;
                border: 1px solid #e0e0e0;
              }
              .eli5-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
              }
              .eli5-logo {
                width: 32px;
                height: 32px;
                border-radius: 8px;
              }
              .eli5-header h3 {
                margin: 0;
                font-size: 16px;
                color: #333;
                font-weight: 600;
              }
              .eli5-loader {
                width: 100%;
                height: 4px;
                background: #f0f0f0;
                border-radius: 2px;
                overflow: hidden;
                position: relative;
              }
              .eli5-loader:after {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                width: 50%;
                background: linear-gradient(90deg, #6e8efb, #a777e3);
                border-radius: 2px;
                animation: eli5-loading 1.5s infinite ease-in-out;
              }
              @keyframes eli5-loading {
                0% { left: -50%; }
                100% { left: 150%; }
              }
            `;
            document.head.appendChild(style);
            document.body.appendChild(loadingDiv);
          }
        });
  
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer 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',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tngtech/deepseek-r1t-chimera:free',
            messages: [{
              role: 'user',
              content: `Explain this in simple terms that someone who does not have knowledge in the topic could understand,use examples if necessary but keep the awnser short: ${info.selectionText}`,
            }],
          }),
        });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'API request failed');
        }
  
        const explanation = data.choices[0]?.message?.content || "Couldn't generate explanation";
  
        // Remove loading indicator and show explanation
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (explanation) => {
            const loadingDiv = document.getElementById('eli5-loading');
            if (loadingDiv) loadingDiv.remove();
  
            const div = document.createElement('div');
            div.className = 'eli5-explanation';
            div.innerHTML = `
              <div class="eli5-container">
                <div class="eli5-header">
                  <img src="${chrome.runtime.getURL('explain_icon.png')}" class="eli5-logo" alt="ELI5 Logo">
                  <h3>Simple Explanation</h3>
                  <button class="eli5-close-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="#666" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
                <div class="eli5-content">
                  ${explanation}
                </div>
              </div>
            `;
            
            // Add styles if not already present
            if (!document.getElementById('eli5-styles')) {
              const style = document.createElement('style');
              style.id = 'eli5-styles';
              style.textContent = `
                .eli5-container {
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  width: 320px;
                  max-height: 80vh;
                  padding: 20px;
                  background: #ffffff;
                  border-radius: 12px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                  z-index: 9999;
                  border: 1px solid #e0e0e0;
                  animation: eli5-fade-in 0.3s ease-out;
                  overflow: hidden;
                  display: flex;
                  flex-direction: column;
                }
                @keyframes eli5-fade-in {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .eli5-header {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 12px;
                  margin-bottom: 16px;
                }
                .eli5-logo {
                  width: 32px;
                  height: 32px;
                  border-radius: 8px;
                }
                .eli5-header h3 {
                  margin: 0;
                  font-size: 16px;
                  color: #333;
                  font-weight: 600;
                  flex-grow: 1;
                }
                .eli5-close-btn {
                  background: none;
                  border: none;
                  padding: 4px;
                  cursor: pointer;
                  border-radius: 50%;
                  transition: background 0.2s;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .eli5-close-btn:hover {
                  background: #f5f5f5;
                }
                .eli5-content {
                  font-size: 14px;
                  line-height: 1.6;
                  color: #444;
                  overflow-y: auto;
                  max-height: 60vh;
                  padding-right: 8px;
                }
                .eli5-content::-webkit-scrollbar {
                  width: 6px;
                }
                .eli5-content::-webkit-scrollbar-track {
                  background: #f1f1f1;
                  border-radius: 3px;
                }
                .eli5-content::-webkit-scrollbar-thumb {
                  background: #d1d1d1;
                  border-radius: 3px;
                }
                .eli5-content::-webkit-scrollbar-thumb:hover {
                  background: #b1b1b1;
                }
              `;
              document.head.appendChild(style);
            }
            
            document.body.appendChild(div);
  
            // Add close button functionality
            div.querySelector('.eli5-close-btn').addEventListener('click', () => {
              div.style.animation = 'eli5-fade-in 0.3s ease-out reverse';
              setTimeout(() => div.remove(), 250);
            });
          },
          args: [explanation]
        });
  
      } catch (error) {
        console.error("Error:", error);
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (errorMsg) => {
            const loadingDiv = document.getElementById('eli5-loading');
            if (loadingDiv) loadingDiv.remove();
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'eli5-container';
            errorDiv.innerHTML = `
              <div class="eli5-header">
                <img src="${chrome.runtime.getURL('explain_icon.png')}" class="eli5-logo" alt="ELI5 Logo">
                <h3>Error</h3>
                <button class="eli5-close-btn">×</button>
              </div>
              <div class="eli5-content">
                ${errorMsg}
              </div>
            `;
            document.body.appendChild(errorDiv);
            
            errorDiv.querySelector('.eli5-close-btn').addEventListener('click', () => {
              errorDiv.remove();
            });
          },
          args: [error.message || 'Failed to get explanation. Please try again.']
        });
      }
    }
  });