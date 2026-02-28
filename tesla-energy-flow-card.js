class TeslaEnergyFlowCard extends HTMLElement {
  static version = "0.2.0";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._demoData = null;
    this._initialized = false;
    this._elements = {};
  }

  setConfig(config) {
    this._config = {
      title: "Energy",
      entities: {},
      image_url: "/hacsfiles/tesla-power-widget/home.png",
      ...config,
    };

    if (!this._initialized) {
      this._renderBase();
      this._initialized = true;
    }

    this._elements.image.src = this._config.image_url;
    this._renderFromState();
  }

  set hass(hass) {
    this._hass = hass;
    this._renderFromState();
  }

  getCardSize() {
    return 6;
  }

  setDemoData(payload) {
    this._demoData = payload;
    this._renderFromState();
  }

  _renderBase() {
    const root = document.createElement("div");
    root.className = "card-root";

    root.innerHTML = `
      <style>
        :host {
          --bg: #0F0F0F;
          --text-main: #f2f2f2;
          --text-dim: #b9b9b9;
          --line: #6f6f6f;
          --font: "Inter", sans-serif;
          display: block;
          min-height: 560px;
        }

        * { box-sizing: border-box; }

        .card-root {
          position: relative;
          width: 100%;
          min-height: 560px;
          background: var(--bg);
          color: var(--text-main);
          font-family: var(--font);
          overflow: hidden;
        }

        .center-wrap {
          position: absolute;
          left: 50%;
          top: 56%;
          transform: translate(-50%, -50%);
          width: min(74%, 820px);
          max-height: 70%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .home-image {
          width: 100%;
          max-width: 820px;
          max-height: 420px;
          object-fit: contain;
          display: block;
        }

        .home-fallback {
          width: min(100%, 820px);
          height: 320px;
          border: 1px solid #2b2b2b;
          background: #121212;
          color: #8f8f8f;
          display: none;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          letter-spacing: .02em;
        }

        .node {
          position: absolute;
          transform: translate(-50%, -50%);
          min-width: 150px;
          text-align: center;
          pointer-events: none;
        }

        .node.hidden { opacity: 0; }

        .name {
          font-size: 18px;
          line-height: 1.2;
          font-weight: 400;
          color: var(--text-dim);
          margin-bottom: 5px;
        }

        .value {
          font-size: 52px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-main);
        }

        .line {
          position: absolute;
          left: 50%;
          width: 1px;
          background: var(--line);
          transform: translateX(-50%);
          opacity: 0.95;
        }

        .line.down {
          top: calc(100% + 10px);
          height: var(--line-len, 180px);
        }

        .line.up {
          bottom: calc(100% + 10px);
          height: var(--line-len, 180px);
        }

        .line.hidden { display: none; }

        @media (max-width: 960px) {
          :host { min-height: 620px; }
          .card-root { min-height: 620px; }
          .center-wrap { top: 58%; width: min(92%, 820px); }
          .node { min-width: 100px; }
          .name { font-size: 14px; }
          .value { font-size: 36px; }
        }
      </style>

      <div class="center-wrap" aria-hidden="true">
        <img class="home-image" id="homeImage" alt="Home" />
        <div class="home-fallback" id="homeFallback">home.png non trovato</div>
      </div>

      <div class="node" id="n-home" style="left: 26%; top: 22%; --line-len: 238px;">
        <div class="name">Casa</div>
        <div class="value" data-k="home">--</div>
        <div class="line down"></div>
      </div>

      <div class="node" id="n-solar" style="left: 66%; top: 20%; --line-len: 206px;">
        <div class="name">Pannelli Solari</div>
        <div class="value" data-k="solar">--</div>
        <div class="line down"></div>
      </div>

      <div class="node" id="n-grid" style="left: 84%; top: 66%; --line-len: 125px;">
        <div class="name">Rete</div>
        <div class="value" data-k="grid">--</div>
        <div class="line up"></div>
      </div>

      <div class="node" id="n-battery" style="left: 50%; top: 86%; --line-len: 124px;">
        <div class="name">Batteria</div>
        <div class="value" data-k="battery">--</div>
        <div class="line up"></div>
      </div>

      <div class="node" id="n-car" style="left: 16%; top: 66%; --line-len: 125px;">
        <div class="name">Auto</div>
        <div class="value" data-k="car">--</div>
        <div class="line up"></div>
      </div>
    `;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(root);

    this._elements = {
      image: root.querySelector("#homeImage"),
      fallback: root.querySelector("#homeFallback"),
      nodes: {
        home: root.querySelector("#n-home"),
        solar: root.querySelector("#n-solar"),
        grid: root.querySelector("#n-grid"),
        battery: root.querySelector("#n-battery"),
        car: root.querySelector("#n-car"),
      },
    };

    this._elements.image.addEventListener("error", () => {
      this._elements.image.style.display = "none";
      this._elements.fallback.style.display = "flex";
    });

    this._elements.image.addEventListener("load", () => {
      this._elements.image.style.display = "block";
      this._elements.fallback.style.display = "none";
    });
  }

  _toNumber(v, fallback = null) {
    if (v === undefined || v === null || v === "" || v === "unknown" || v === "unavailable") return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  _powerToKw(stateObj) {
    if (!stateObj) return null;
    const value = this._toNumber(stateObj.state, null);
    if (value === null) return null;
    const uom = String(stateObj.attributes?.unit_of_measurement || "").toLowerCase();
    if (uom === "w") return value / 1000;
    return value;
  }

  _stateNum(entityId) {
    if (!this._hass || !entityId) return null;
    return this._toNumber(this._hass.states?.[entityId]?.state, null);
  }

  _readData() {
    if (this._demoData) return { ...this._demoData };

    const e = this._config.entities || {};

    return {
      solar: this._powerToKw(this._hass?.states?.[e.solar_power]),
      home: this._powerToKw(this._hass?.states?.[e.home_power]),
      grid: this._powerToKw(this._hass?.states?.[e.grid_power]),
      batteryPower: this._powerToKw(this._hass?.states?.[e.battery_power]),
      batterySoc: this._stateNum(e.battery_soc),
      carPower: this._powerToKw(this._hass?.states?.[e.car_power]),
      carSoc: this._stateNum(e.car_soc),
    };
  }

  _formatPower(v) {
    if (!Number.isFinite(v)) return "--";
    return `${Math.abs(v).toFixed(1)} kW`;
  }

  _setNode(key, powerKw, visible) {
    const node = this._elements.nodes[key];
    if (!node) return;

    node.classList.toggle("hidden", !visible);

    const line = node.querySelector(".line");
    if (line) line.classList.toggle("hidden", !visible);

    const valueEl = this.shadowRoot.querySelector(`[data-k='${key}']`);
    if (valueEl) valueEl.textContent = this._formatPower(powerKw);
  }

  _renderFromState() {
    if (!this._initialized) return;

    const data = this._readData();

    const solar = Math.max(0, this._toNumber(data.solar, 0));
    const home = Math.max(0, this._toNumber(data.home, 0));
    const grid = this._toNumber(data.grid, null);
    const batteryPower = this._toNumber(data.batteryPower, null);
    const batterySoc = this._toNumber(data.batterySoc, null);
    const carPower = this._toNumber(data.carPower, null);
    const carSoc = this._toNumber(data.carSoc, null);

    this._setNode("solar", solar, true);
    this._setNode("home", home, true);

    const showGrid = grid !== null;
    this._setNode("grid", grid || 0, showGrid);

    const showBattery = batteryPower !== null || batterySoc !== null;
    this._setNode("battery", batteryPower || 0, showBattery);

    const showCar = carPower !== null || carSoc !== null;
    this._setNode("car", carPower || 0, showCar);
  }
}

customElements.define("tesla-energy-flow-card", TeslaEnergyFlowCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "tesla-energy-flow-card",
  name: "Tesla Energy Flow Card",
  description: "Minimal Tesla-like static layout with centered home image",
});
