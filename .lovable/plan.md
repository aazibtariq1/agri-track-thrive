

## Plan: Add AI-Powered Farm Advisory System

### Overview
Add an intelligent AI assistant to your farming app that provides:
1. **Price Predictions** - Predict future crop and input prices based on market trends
2. **Best Selling Time Recommendations** - AI suggests when to sell your crops for maximum profit
3. **Cost Optimization** - When to buy fertilizers, seeds, diesel at best prices
4. **Profit Calculator** - Compare your input costs vs predicted selling prices
5. **Farm Advisory Chat** - Ask questions in Urdu/English about farming, markets, weather impact

### Architecture

```text
+------------------+     +-------------------+     +------------------+
|   Market Prices  | --> |   AI Edge         | --> |   Lovable AI     |
|   Page           |     |   Function        |     |   (Gemini)       |
+------------------+     +-------------------+     +------------------+
        |                        |
        v                        v
+------------------+     +-------------------+
|   User's Crops   |     |   AI Response     |
|   & Inventory    |     |   (Predictions)   |
+------------------+     +-------------------+
```

### Features to Add

#### 1. AI Insights Panel on Market Prices Page
- "AI Advisor" button that opens a chat/insights panel
- Shows predictions like:
  - "Wheat prices expected to rise 5-8% in next 2 weeks due to harvest season ending"
  - "Best time to sell cotton: within next 10 days before international market dip"
  - "Diesel prices stable - good time to stock up"

#### 2. Price Prediction Cards
- Each crop/input card shows an AI-generated prediction icon
- Click to see detailed prediction with reasoning
- Predictions based on:
  - Seasonal patterns (Rabi/Kharif cycles)
  - Historical price data
  - Current market trends

#### 3. Smart Farm Chat Assistant
- Chat interface to ask questions like:
  - "When should I sell my wheat?"
  - "What fertilizer do I need for cotton in February?"
  - "Calculate my profit if I sell 500kg wheat at current price"
- Responds in English or Urdu based on query

#### 4. Profit Optimizer
- Input: Your crop type, quantity, current input costs
- Output: AI calculates optimal selling price and timing
- Shows break-even point and profit margins

### Technical Implementation

#### Step 1: Create Edge Function for AI
Create `supabase/functions/farm-advisor/index.ts`:
- Connects to Lovable AI (Gemini model)
- Accepts: current prices, user's crops, inventory, question type
- Returns: AI-generated insights, predictions, or chat response

#### Step 2: Add AI Insights Component
Create `src/components/AIFarmAdvisor.tsx`:
- Floating chat button on Market Prices page
- Expandable panel with chat interface
- Quick action buttons: "Price Predictions", "Selling Advice", "Ask Question"

#### Step 3: Add Prediction Display
Update `src/pages/MarketPrices.tsx`:
- Add "Get AI Insights" button in header
- Show prediction badges on price cards
- Add "AI Analysis" tab alongside Crops/Inputs tabs

#### Step 4: Create Chat Interface
- Message history display with markdown support
- Input field for questions (supports Urdu)
- Loading states and error handling

### User Experience Flow

1. User opens Market Prices page
2. Sees "AI Farm Advisor" button (sparkle icon)
3. Clicks to open advisor panel
4. Options shown:
   - "Analyze Today's Prices" - Get overall market analysis
   - "When to Sell?" - Get selling recommendations for their crops
   - "Cost Optimizer" - Find best time to buy inputs
   - "Ask Anything" - Free-form chat

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/farm-advisor/index.ts` | Edge function for AI calls |
| `src/components/AIFarmAdvisor.tsx` | Main advisor UI component |
| `src/components/AIChat.tsx` | Chat interface component |
| `src/hooks/useAIAdvisor.ts` | Hook for AI API calls |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/MarketPrices.tsx` | Add AI Advisor button and integration |
| `supabase/config.toml` | Add farm-advisor function config |
| `package.json` | Add react-markdown for rendering AI responses |

### AI Prompt Context
The AI will be given context about:
- Khanpur/Rahim Yar Khan region specifically
- Current crop prices from the app
- User's active crops and inventory (if available)
- Seasonal farming patterns in South Punjab
- Local market dynamics (JDW Mills, Khanpur Mandi, etc.)

### Sample AI Responses

**Price Prediction:**
> "Based on current Khanpur Mandi rates, wheat at PKR 4,425/40kg is slightly below seasonal average. Expect 3-5% increase by mid-February as government procurement begins. **Recommendation:** Hold wheat stock for 2-3 weeks if storage available."

**Selling Advice:**
> "Your 500kg cotton harvest at current rate of PKR 7,500/40kg would yield PKR 93,750. However, RYK Cotton Market typically sees 8-10% price increase in late January. **Suggestion:** Sell by January 25th for optimal returns."

**Cost Optimization:**
> "Diesel at PKR 257/liter (OGRA rate) is stable. Urea prices showing slight upward trend - consider buying before Rabi season peak. DAP at PKR 13,200 is at yearly high - wait for February price correction if possible."

### No Additional API Keys Needed
This implementation uses Lovable AI which is automatically available - no external API key required from the user.

