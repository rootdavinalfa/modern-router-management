## 📄 PRD: "Router-Core" Multi-Vendor Interface

### 1. Unified Architecture: The Plugin System

To support multiple routers, we use the **Strategy Pattern**. The backend will define a strict `RouterDriver` interface. Each router (like the ZTE F6600P) becomes a "Driver" that implements these methods.

#### **RouterDriver Interface Definition**

```typescript
interface RouterDriver {
  authenticate(): Promise<boolean>;
  getSystemStatus(): Promise<RouterStatusDTO>;
  getConnectedDevices(): Promise<DeviceDTO[]>;
  updateWifiSettings(config: WifiConfigDTO): Promise<void>;
  reboot(): Promise<void>;
}
```

### 2. The Scraper Engine (Playwright)

Since many modern routers (including the ZTE F6600P) use JavaScript to render their admin panels and handle complex login handshakes (like CSRF tokens and timed redirects), a standard HTTP fetch is often insufficient.

- **Technology:** [Playwright](https://playwright.dev/) (Chromium) integrated into NestJS.
- **Mode:** **Headless** by default, with a "Persistence Context" to reuse cookies and avoid re-logging in for every request.
- **Wait Strategy:** Uses `page.waitForSelector()` to handle the ZTE’s asynchronous loading states.

---

### 3. Monorepo Structure (Turborepo)

We will use Turborepo to keep the "Drivers" separated from the main API logic.

```text
.
├── apps
│   ├── api (NestJS)              # Main Gateway & Controller
│   └── web (TanStack Start)      # Dashboards & Forms
├── packages
│   ├── drivers                   # The Plugin Library
│   │   ├── base-driver.ts        # Abstract class
│   │   ├── zte-f6600p.ts         # ZTE specific logic (Playwright)
│   │   └── tplink-archer.ts      # Future plugin example
│   ├── ui                        # shadcn/ui components
│   └── types                     # Shared Zod schemas & TypeScript types

```

---

### 4. Technical Workflow: ZTE F6600P Scraper

For the ZTE F6600P, the driver will follow this lifecycle:

1. **Browser Initialization:** NestJS starts a singleton Playwright browser instance.
2. **JS Execution:** Navigate to `192.168.1.1`. Wait for the GCH-based JavaScript login form to appear.
3. **Data Extraction:** Use `page.evaluate()` to pull data directly from the router's internal JavaScript objects (often found in `window.config` or similar) rather than just parsing raw HTML.
4. **JSON Normalization:** Convert the messy ZTE-specific data into the clean `RouterStatusDTO` format defined in `packages/types`.

---

### 5. Frontend UI (TanStack Start + shadcn)

Using **TanStack Start**, we get full-stack type safety from the API to the UI.

- **Dynamic UI Rendering:** The dashboard should check which "Driver" is active and show/hide features accordingly (e.g., if a router doesn't support 5GHz, the UI hides that card).
- **State Management:** [TanStack Query](https://tanstack.com/query) will handle the "polling" of the router status every 10 seconds to show real-time signal strength.
- **UI Components (shadcn):**
- `Sidebar`: Navigation between Status, Devices, and Advanced Settings.
- `Badge`: Show "Online/Offline" status.
- `Table`: For the Connected Devices list.

---

### 6. Security Considerations

- **Local-Only API:** Ensure the NestJS API only listens on `localhost` or a VPN interface.
- **Credential Encryption:** Store router passwords in an `.env` file or an encrypted local SQLite database; never hardcode them in drivers.
- **Headless Overhead:** Playwright uses significant RAM (~100MB+). If running on a Raspberry Pi, ensure swap is enabled or use `chromium-browser` with `--disable-gpu`.
- **Use Better Auth:** Use credentials from a backend service to authenticate with the router.

### 7. Read This Docs

- docs/task.md (Task Notes)
