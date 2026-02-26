# Tesla Energy Flow Card

Custom Lovelace card (no framework/dependency) con UI ispirata Tesla per visualizzare i flussi energetici live.

## Obiettivi del design

- Tema sempre scuro, anche in modalità giorno.
- Placeholder centrale 3D con cubo statico (nessuna animazione del modello).
- Flussi energetici animati con linee ortogonali (no curve).
- Nodi dinamici: se un'entità è assente/non disponibile, il nodo viene nascosto.
- CSS variables semplici da modificare.

## Installazione Home Assistant (HACS)

1. Pubblica questa cartella su un repository GitHub.
2. In HACS: `Frontend` -> menu `...` -> `Custom repositories`.
3. Aggiungi URL repo e seleziona categoria `Dashboard`.
4. Installa **Tesla Energy Flow Card**.
5. Riavvia Home Assistant (o refresh completo browser).
6. Aggiungi risorsa se non auto-registrata da HACS:
   - URL: `/hacsfiles/<repo-name>/tesla-energy-flow-card.js`
   - Type: `module`

## Configurazione Lovelace

Snippet pronto: [examples/lovelace.yaml](/Users/francesco/Documents/Sviluppo/Homeassistant/TeslaPW/examples/lovelace.yaml)

Esempio:

```yaml
type: custom:tesla-energy-flow-card
title: Tesla Energy
show_header: true
show_theme_toggle: false
theme_mode: auto
model_url: /hacsfiles/tesla-power-widget/home.glb
model_scale: 1
entities:
  solar_power: sensor.pv_power
  home_power: sensor.home_load_power
  grid_power: sensor.grid_power
  battery_power: sensor.powerwall_power
  battery_soc: sensor.powerwall_soc
  car_power: sensor.ev_charging_power
  car_soc: sensor.ev_battery_level
  weather: weather.milano
sun_entity: sun.sun
```

## Entità supportate

- `entities.solar_power` (W o kW)
- `entities.home_power` (W o kW)
- `entities.grid_power` (W o kW; `+` import, `-` export)
- `entities.battery_power` (W o kW; `+` charge, `-` discharge)
- `entities.battery_soc` (%)
- `entities.car_power` (W o kW)
- `entities.car_soc` (%)
- `entities.weather` (opzionale, per day/night auto)
- `sun_entity` (default `sun.sun`)

## Modello 3D GLB

- `model_url`: path del modello GLB (default: `/hacsfiles/tesla-power-widget/home.glb`)
- `model_scale`: scala modello (`1` default)
- Se il modello non si carica, la card usa automaticamente il cubo fallback.

## Day/Night

- `theme_mode: auto` usa `entities.weather` (se presente) o `sun.sun`.
- `theme_mode: day` forza tema giorno.
- `theme_mode: night` forza tema notte.
- Il background resta comunque dark in tutti i modi (stile Tesla).

## Personalizzazione CSS rapida

Modifica variabili in `:host` dentro [tesla-energy-flow-card.js](/Users/francesco/Documents/Sviluppo/Homeassistant/TeslaPW/tesla-energy-flow-card.js):

- `--tef-solar`, `--tef-grid`, `--tef-battery`, `--tef-car`
- `--tef-bg-top`, `--tef-bg-mid`, `--tef-bg-bot`
- `--tef-font-main`
- `--tef-wire-idle`

## Aggiornabilità

Per avere aggiornamenti ordinati su Home Assistant:

1. Mantieni un branch principale (`main`) per sviluppo.
2. Crea tag/release su GitHub (`v0.x.x`) quando vuoi distribuire.
3. HACS rileva nuove versioni e propone update della card.

Nota: aggiornamento automatico immediato a ogni push non è consigliato in produzione. Con release versionate hai rollback e stabilità.

## Test browser locale

Apri [index.html](/Users/francesco/Documents/Sviluppo/Homeassistant/TeslaPW/index.html) per vedere la demo standalone.

La demo espone anche:

```js
window.demoUpdate({
  solar: 4.2,
  home: 3.1,
  grid: 0.7,
  batteryPower: -1.4,
  batterySoc: 58,
  carPower: 2.8,
  carSoc: 47
});
```
