"use client";

import Life from "./eletjatek";
import { useCallback, useEffect, useRef, useState } from "react";


const ALAP_SOROK = 10;
const ALAP_OSZLOPOK = 10;
const KESLELTETES = 500;


const ALAKZATOK = [
  {
    nev: "Glider",
    leiras: "mozgó",
    cellak: [[0,1],[1,2],[2,0],[2,1],[2,2]] as [number,number][],
  },
  {
    nev: "Blinker",
    leiras: "oszcillál",
    cellak: [[0,0],[0,1],[0,2]] as [number,number][],
  },
  {
    nev: "Stabil 2×2",
    leiras: "soha nem változik",
    cellak: [[0,0],[0,1],[1,0],[1,1]] as [number,number][],
  },
  {
    nev: "Pulsar",
    leiras: "periódus 3",
    cellak: [
      [0,2],[0,3],[0,4],[0,8],[0,9],[0,10],
      [2,0],[2,5],[2,7],[2,12],[3,0],[3,5],[3,7],[3,12],
      [4,0],[4,5],[4,7],[4,12],[5,2],[5,3],[5,4],[5,8],[5,9],[5,10],
      [7,2],[7,3],[7,4],[7,8],[7,9],[7,10],
      [8,0],[8,5],[8,7],[8,12],[9,0],[9,5],[9,7],[9,12],
      [10,0],[10,5],[10,7],[10,12],[12,2],[12,3],[12,4],[12,8],[12,9],[12,10],
    ] as [number,number][],
  },
  {
    nev: "Glider Gun",
    leiras: "Gosper-féle",
    cellak: [
      [0,24],[1,22],[1,24],[2,12],[2,13],[2,20],[2,21],[2,34],[2,35],
      [3,11],[3,15],[3,20],[3,21],[3,34],[3,35],[4,0],[4,1],[4,10],
      [4,16],[4,20],[4,21],[5,0],[5,1],[5,10],[5,14],[5,16],[5,17],
      [5,22],[5,24],[6,10],[6,16],[6,24],[7,11],[7,15],[8,12],[8,13],
    ] as [number,number][],
  },
  {
    nev: "LWSS",
    leiras: "kis űrhajó",
    cellak: [[0,1],[0,4],[1,0],[2,0],[2,4],[3,0],[3,1],[3,2],[3,3]] as [number,number][],
  },
  {
    nev: "R-pentomino",
    leiras: "kaotikus",
    cellak: [[0,1],[0,2],[1,0],[1,1],[2,1]] as [number,number][],
  },
  {
    nev: "Beacon",
    leiras: "periódus 2",
    cellak: [[0,0],[0,1],[1,0],[2,3],[3,2],[3,3]] as [number,number][],
  },
];

function ujTabla(sorok: number, oszlopok: number): number[][] {
  const tabla: number[][] = [];
  for (let i = 0; i < sorok + 2; i++) {
    const sor: number[] = [];
    for (let j = 0; j < oszlopok + 2; j++) {
      if (i === 0 || i === sorok + 1 || j === 0 || j === oszlopok + 1) {
        sor.push(0);
      } else {
        sor.push(Math.random() < 0.3 ? 1 : 0);
      }
    }
    tabla.push(sor);
  }
  return tabla;
}

function uresTabla(sorok: number, oszlopok: number): number[][] {
  return Array.from({ length: sorok + 2 }, () =>
    new Array(oszlopok + 2).fill(0)
  );
}

function ujRvbTabla(sorok: number, oszlopok: number): [number[][], number[][]] {
  const piros = uresTabla(sorok, oszlopok);
  const kek = uresTabla(sorok, oszlopok);
  for (let i = 1; i <= sorok; i++) {
    for (let j = 1; j <= oszlopok; j++) {
      const v = Math.random();
      if (v < 0.15) piros[i][j] = 1;
      else if (v < 0.30) kek[i][j] = 1;
    }
  }
  return [piros, kek];
}

function tablaKombinal(piros: number[][], kek: number[][]): number[][] {
  return piros.map((sor, i) => sor.map((cella, j) => cella || kek[i][j] ? 1 : 0));
}

type Mod = "normal" | "rvb" | "alakzatok";

export default function HomePage() {
  const [mod, setMod] = useState<Mod>("normal");
  const [sorok, setSorok] = useState(ALAP_SOROK);
  const [oszlopok, setOszlopok] = useState(ALAP_OSZLOPOK);

  const [tabla, setTabla] = useState<number[][]>(() => ujTabla(ALAP_SOROK, ALAP_OSZLOPOK));
  const [pirosTabla, setPirosTabla] = useState<number[][]>(() => uresTabla(ALAP_SOROK, ALAP_OSZLOPOK));
  const [kekTabla, setKekTabla] = useState<number[][]>(() => uresTabla(ALAP_SOROK, ALAP_OSZLOPOK));

  const [fut, setFut] = useState(false);
  const [kor, setKor] = useState(0);
  const [kivalasztottAlakezat, setKivalasztottAlakzat] = useState<typeof ALAKZATOK[0] | null>(null);
  const [kesleltetes, setKesleltetes] = useState(KESLELTETES);

  const futRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  function cellaMegjelenites(ertek: number, kulso: boolean): string {
    if (kulso) return "X";
    return ertek === 1 ? "S" : " ";
  }

  function rvbCellaMegjelenites(r: number, c: number, kulso: boolean): { char: string; szin: string } {
    if (kulso) return { char: "X", szin: "text-base-content/30" };
    const p = pirosTabla[r][c];
    const k = kekTabla[r][c];
    if (p && k) return { char: "S", szin: "text-green-500" };
    if (p) return { char: "S", szin: "text-red-500" };
    if (k) return { char: "S", szin: "text-blue-500" };
    return { char: " ", szin: "" };
  }

  const kovetkezoAllapot = useCallback(() => {
    if (mod === "rvb") {
      const pirosElet = new Life(pirosTabla.map(s => [...s]));
      const kekElet = new Life(kekTabla.map(s => [...s]));
      pirosElet.lepes();
      kekElet.lepes();

      const ujPiros = pirosElet.tabla;
      const ujKek = kekElet.tabla;

      const kombinalt = tablaKombinal(pirosTabla, kekTabla);
      for (let i = 1; i <= sorok; i++) {
        for (let j = 1; j <= oszlopok; j++) {
          if (!kombinalt[i][j] && (ujPiros[i][j] || ujKek[i][j])) {
            let np = 0, nk = 0;
            for (let di = -1; di <= 1; di++) {
              for (let dj = -1; dj <= 1; dj++) {
                if (di === 0 && dj === 0) continue;
                if (pirosTabla[i+di]?.[j+dj]) np++;
                if (kekTabla[i+di]?.[j+dj]) nk++;
              }
            }
            ujPiros[i][j] = np >= nk ? 1 : 0;
            ujKek[i][j] = nk > np ? 1 : 0;
          }
        }
      }

      setPirosTabla(ujPiros);
      setKekTabla(ujKek);
      setTabla(tablaKombinal(ujPiros, ujKek));
    } else {
      const elet = new Life(tabla.map(s => [...s]));
      elet.lepes();
      setTabla(elet.tabla);
    }
    setKor(k => k + 1);
  }, [mod, tabla, pirosTabla, kekTabla, sorok, oszlopok]);

  const leallitLoop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const inditLoop = useCallback(() => {
    if (!futRef.current) return;
    kovetkezoAllapot();
    timerRef.current = setTimeout(inditLoop, kesleltetes);
  }, [kovetkezoAllapot, kesleltetes]);

  const toggleFut = useCallback(() => {
    const uj = !futRef.current;
    futRef.current = uj;
    setFut(uj);
    if (uj) inditLoop();
    else leallitLoop();
  }, [inditLoop, leallitLoop]);

  useEffect(() => {
    if (futRef.current) {
      leallitLoop();
      timerRef.current = setTimeout(inditLoop, kesleltetes);
    }
  }, [kesleltetes, inditLoop, leallitLoop]);

  useEffect(() => () => leallitLoop(), [leallitLoop]);

  useEffect(() => {
    const lekezeles = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        toggleFut();
      }
    };
    window.addEventListener("keydown", lekezeles);
    return () => window.removeEventListener("keydown", lekezeles);
  }, [toggleFut]);

  const modValt = (ujMod: Mod) => {
    leallitLoop();
    futRef.current = false;
    setFut(false);
    setMod(ujMod);
    setKivalasztottAlakzat(null);
    setKor(0);
    if (ujMod === "rvb") {
      const [p, k] = ujRvbTabla(sorok, oszlopok);
      setPirosTabla(p);
      setKekTabla(k);
      setTabla(tablaKombinal(p, k));
    } else {
      setTabla(ujTabla(sorok, oszlopok));
      setPirosTabla(uresTabla(sorok, oszlopok));
      setKekTabla(uresTabla(sorok, oszlopok));
    }
  };

  const meretValt = (ujSorok: number, ujOszlopok: number) => {
    leallitLoop();
    futRef.current = false;
    setFut(false);
    setSorok(ujSorok);
    setOszlopok(ujOszlopok);
    setKor(0);
    if (mod === "rvb") {
      const [p, k] = ujRvbTabla(ujSorok, ujOszlopok);
      setPirosTabla(p);
      setKekTabla(k);
      setTabla(tablaKombinal(p, k));
    } else {
      setTabla(ujTabla(ujSorok, ujOszlopok));
    }
  };

  const cellaKlikk = (sor: number, oszlop: number) => {
    if (sor === 0 || sor === sorok + 1 || oszlop === 0 || oszlop === oszlopok + 1) return;

    if (mod === "alakzatok" && kivalasztottAlakezat) {
      const ujTabla2 = tabla.map(s => [...s]);
      for (const [dr, dc] of kivalasztottAlakezat.cellak) {
        const r = sor + dr;
        const c = oszlop + dc;
        if (r > 0 && r <= sorok && c > 0 && c <= oszlopok) {
          ujTabla2[r][c] = 1;
        }
      }
      setTabla(ujTabla2);
      return;
    }

    if (mod === "rvb") {
      const ujPiros = pirosTabla.map(s => [...s]);
      ujPiros[sor][oszlop] = ujPiros[sor][oszlop] ? 0 : 1;
      if (ujPiros[sor][oszlop]) {
        const ujKek = kekTabla.map(s => [...s]);
        ujKek[sor][oszlop] = 0;
        setKekTabla(ujKek);
      }
      setPirosTabla(ujPiros);
      setTabla(tablaKombinal(ujPiros, kekTabla));
      return;
    }

    const ujTabla2 = tabla.map(s => [...s]);
    ujTabla2[sor][oszlop] = ujTabla2[sor][oszlop] ? 0 : 1;
    setTabla(ujTabla2);
  };

  const kekCellaKlikk = (e: React.MouseEvent, sor: number, oszlop: number) => {
    e.preventDefault();
    if (mod !== "rvb") return;
    if (sor === 0 || sor === sorok + 1 || oszlop === 0 || oszlop === oszlopok + 1) return;
    const ujKek = kekTabla.map(s => [...s]);
    ujKek[sor][oszlop] = ujKek[sor][oszlop] ? 0 : 1;
    if (ujKek[sor][oszlop]) {
      const ujPiros = pirosTabla.map(s => [...s]);
      ujPiros[sor][oszlop] = 0;
      setPirosTabla(ujPiros);
    }
    setKekTabla(ujKek);
    setTabla(tablaKombinal(pirosTabla, ujKek));
  };

  const torles = () => {
    leallitLoop();
    futRef.current = false;
    setFut(false);
    setTabla(uresTabla(sorok, oszlopok));
    setPirosTabla(uresTabla(sorok, oszlopok));
    setKekTabla(uresTabla(sorok, oszlopok));
    setKor(0);
  };

  const random = () => {
    leallitLoop();
    futRef.current = false;
    setFut(false);
    setKor(0);
    if (mod === "rvb") {
      const [p, k] = ujRvbTabla(sorok, oszlopok);
      setPirosTabla(p);
      setKekTabla(k);
      setTabla(tablaKombinal(p, k));
    } else {
      setTabla(ujTabla(sorok, oszlopok));
    }
  };

  const sejtekSzama = tabla.flat().filter(Boolean).length;
  const pirosSejtekSzama = pirosTabla.flat().filter(Boolean).length;
  const kekSejtekSzama = kekTabla.flat().filter(Boolean).length;

  return (
    <div className="min-h-screen bg-base-100 p-6 font-mono">
      <div className="mx-auto max-w-5xl">

        <div className="mb-6">
          <h1 className="text-3xl font-medium tracking-[0.3em] text-base-content uppercase mb-1">
            Életjáték
          </h1>
        </div>

        <div role="tablist" className="tabs tabs-border mb-5">
          {(["normal", "rvb", "alakzatok"] as Mod[]).map((m) => (
            <button
              key={m}
              role="tab"
              className={`tab text-xs tracking-widest uppercase ${mod === m ? "tab-active font-semibold" : ""}`}
              onClick={() => modValt(m)}
            >
              {m === "normal" ? "Normál" : m === "rvb" ? "Red vs Blue" : "Alakzatok"}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-base-content/60 tracking-widest">
          <label className="flex items-center gap-2">
            SOROK
            <input
              type="number" min={5} max={40} value={sorok}
              onChange={e => meretValt(Number(e.target.value) || ALAP_SOROK, oszlopok)}
              className="input input-xs input-bordered w-16 font-mono text-center"
            />
          </label>
          <label className="flex items-center gap-2">
            OSZLOPOK
            <input
              type="number" min={5} max={60} value={oszlopok}
              onChange={e => meretValt(sorok, Number(e.target.value) || ALAP_OSZLOPOK)}
              className="input input-xs input-bordered w-16 font-mono text-center"
            />
          </label>
          <label className="flex items-center gap-2">
            SEBESSÉG (ms)
            <input
              type="number" min={50} max={2000} step={50} value={kesleltetes}
              onChange={e => setKesleltetes(Number(e.target.value) || KESLELTETES)}
              className="input input-xs input-bordered w-20 font-mono text-center"
            />
          </label>
        </div>

        {mod === "alakzatok" && (
          <div className="mb-4">
            <p className="mb-2 text-[10px] tracking-[0.2em] text-base-content/40 uppercase">
              Válassz alakzatot vagy rajzolj szabadon — kattintással helyezd el a rácsra
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setKivalasztottAlakzat(null)}
                className={`btn btn-xs normal-case tracking-wide font-mono ${
                  kivalasztottAlakezat === null ? "btn-primary" : "btn-outline"
                }`}
              >
                Szabad rajzolás
                <span className="opacity-50 font-normal">· kézi</span>
              </button>
              {ALAKZATOK.map((a) => (
                <button
                  key={a.nev}
                  onClick={() => setKivalasztottAlakzat(kivalasztottAlakezat?.nev === a.nev ? null : a)}
                  className={`btn btn-xs normal-case tracking-wide font-mono ${
                    kivalasztottAlakezat?.nev === a.nev ? "btn-primary" : "btn-outline"
                  }`}
                >
                  {a.nev}
                  <span className="opacity-50 font-normal">· {a.leiras}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] tracking-widest text-base-content/50">
              {kivalasztottAlakezat
                ? `„${kivalasztottAlakezat.nev}" kiválasztva · kattints a rácsra az elhelyezéshez`
                : "Szabad rajzolás · kattints a cellákra az élő/halott váltáshoz"}
            </p>
          </div>
        )}

        {mod === "rvb" && (
          <div className="mb-3 flex gap-5 text-xs tracking-widest text-base-content/60">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />
              Piros (bal klikk)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
              Kék (jobb klikk)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
              Vegyes
            </span>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            className={`btn btn-sm font-mono tracking-widest uppercase ${fut ? "btn-warning" : "btn-primary"}`}
            onClick={toggleFut}
          >
            {fut ? "⏸ Megállít" : "▶ Indít"}
          </button>
          <button className="btn btn-sm btn-outline font-mono tracking-widest uppercase" onClick={() => { if (!fut) kovetkezoAllapot(); }}>
            Lépés
          </button>
          <button className="btn btn-sm btn-outline font-mono tracking-widest uppercase" onClick={random}>
            Random
          </button>
          <button className="btn btn-sm btn-outline btn-error font-mono tracking-widest uppercase" onClick={torles}>
            Töröl
          </button>
        </div>

        <div className="mb-3 flex gap-6 text-xs tracking-widest text-base-content/50">
          <span>KÖR <span className="text-base-content font-medium text-base">{kor}</span></span>
          {mod !== "rvb" && (
            <span>SEJT <span className="text-base-content font-medium text-base">{sejtekSzama}</span></span>
          )}
          {mod === "rvb" && (
            <>
              <span className="text-red-500">PIROS <span className="font-medium text-base">{pirosSejtekSzama}</span></span>
              <span className="text-blue-500">KÉK <span className="font-medium text-base">{kekSejtekSzama}</span></span>
            </>
          )}
        </div>

        <div className="overflow-x-auto">
          <div
            className="inline-block border border-base-content/20 rounded"
            style={{ lineHeight: 1 }}
          >
            {tabla.map((sor, i) => (
              <div key={i} className="flex">
                {sor.map((ertek, j) => {
                  const kulso = i === 0 || i === sorok + 1 || j === 0 || j === oszlopok + 1;
                  const rvb = mod === "rvb" ? rvbCellaMegjelenites(i, j, kulso) : null;

                  const char = rvb ? rvb.char : cellaMegjelenites(ertek, kulso);
                  const szinOsztaly = rvb
                    ? rvb.szin
                    : kulso
                      ? "text-base-content/25 bg-base-200"
                      : ertek
                        ? "text-base-content bg-base-content/10"
                        : "text-transparent";

                  return (
                    <button
                      key={j}
                      onClick={() => cellaKlikk(i, j)}
                      onContextMenu={(e) => kekCellaKlikk(e, i, j)}
                      className={`
                        flex items-center justify-center
                        font-mono font-bold select-none
                        transition-colors duration-75
                        ${kulso ? "cursor-default" : "cursor-pointer hover:bg-base-content/10"}
                        ${szinOsztaly}
                      `}
                      style={{ width: 22, height: 22, fontSize: 11 }}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
