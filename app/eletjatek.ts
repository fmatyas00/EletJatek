export default class Life {
  tabla: number[][] = []; 

  constructor(tabla: number[][]) {
    this.tabla = tabla
  }

  private EloszomszedokMegszamolasa(sor: number, oszlop: number): number {
    const iranyok = [
      [-1, -1], [-1, 0], [-1, 1],
      [ 0, -1],          [ 0, 1],
      [ 1, -1], [ 1, 0], [ 1, 1],
    ]
    let szam = 0
    const sorok = this.tabla.length
    const oszlopok = this.tabla[0]?.length ?? 0
  
    for (const [xErtek, yErtek] of iranyok) {
      const UjSor = sor + xErtek
      const UjOszlop = oszlop + yErtek
  
      const SoronEllenorzes = UjSor >= 0 && UjSor < sorok
      const OszlopEllenorzes = UjOszlop >= 0 && UjOszlop < oszlopok
  
      if (SoronEllenorzes && OszlopEllenorzes) {
        const SzomszedErtek = this.tabla[UjSor][UjOszlop]
        if (SzomszedErtek === 1) {
          szam++
        }
      }
    }
  
    return szam
  }

  public lepes() {
    let KovetkezoTabla: number[][] = []
  
    for (let i = 0; i < this.tabla.length; i++) {
      let KovetkezoSor: number[] = []
  
      for (let j = 0; j < this.tabla[i].length; j++) {
        const EloSzomszedok = this.EloszomszedokMegszamolasa(i, j)
  
        if (this.tabla[i][j] === 1) {
          if (EloSzomszedok < 2 || EloSzomszedok > 3) {
            KovetkezoSor.push(0)
          } else {
            KovetkezoSor.push(1)
          }
        } else {
          if (EloSzomszedok === 3) {
            KovetkezoSor.push(1)
          } else {
            KovetkezoSor.push(0)
          }
        }
      }
  
      KovetkezoTabla.push(KovetkezoSor)
    }
  
    this.tabla = KovetkezoTabla
  }
}