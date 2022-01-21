declare interface iStats {
  REVISION: number
  dom: HTMLDivElement
  addPanel(panel: nStats.Panel): nStats.Panel
  showPanel(id: number): void
  begin(): void
  end(): void
  update(): void
  domElement: HTMLDivElement
  setMode(id: number): void
}

declare function Stats(): iStats

declare namespace nStats {
  interface Panel {
    dom: HTMLCanvasElement
    update(value: number, maxValue: number): void
  }

  function Panel(name?: string, fg?: string, bg?: string): Panel
}

export default Stats
