import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import pokemonList from "../pokemon/gen1.jsx";
import "./styles.css";
import "./types.css";
const typeNames = {
  Grass: "Grama",
  Poison: "Veneno",
  Fire: "Fogo",
  Flying: "Voador",
  Water: "Água",
  Bug: "Inseto",
  Normal: "Normal",
  Electric: "Elétrico",
  Ground: "Terrestre",
  Fairy: "Fada",
  Fighting: "Lutador",
  Psychic: "Psíquico",
  Rock: "Pedra",
  Steel: "Aço",
  Ice: "Gelo",
  Ghost: "Fantasma",
  Dragon: "Dragão",
};
const formatTypes = (types) =>
  types.map((type) => typeNames[type] || type).join(" / ");
const typeAdvantages = {
  Normal: [],
  Fire: ["Grass", "Bug", "Ice", "Steel"],
  Water: ["Fire", "Ground", "Rock"],
  Electric: ["Water", "Flying"],
  Grass: ["Water", "Ground", "Rock"],
  Ice: ["Grass", "Ground", "Flying", "Dragon"],
  Fighting: ["Normal", "Ice", "Rock", "Dark", "Steel"],
  Poison: ["Grass", "Fairy"],
  Ground: ["Fire", "Electric", "Poison", "Rock", "Steel"],
  Flying: ["Grass", "Fighting", "Bug"],
  Psychic: ["Fighting", "Poison"],
  Bug: ["Grass", "Psychic", "Dark"],
  Rock: ["Fire", "Ice", "Flying", "Bug"],
  Ghost: ["Psychic", "Ghost"],
  Dragon: ["Dragon"],
  Dark: ["Psychic", "Ghost"],
  Steel: ["Ice", "Rock", "Fairy"],
  Fairy: ["Fighting", "Dragon", "Dark"],
};
const allTypes = Object.keys(typeAdvantages);
const apiBase = "https://pokeapi.co/api/v2";
const battleApiBase = "https://api.pokemonbattle-stage.ru/v2";
const typeSpriteBase = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/brilliant-diamond-shining-pearl";
const typeIds = { normal: 1, fighting: 2, flying: 3, poison: 4, ground: 5, rock: 6, bug: 7, ghost: 8, steel: 9, fire: 10, water: 11, grass: 12, electric: 13, psychic: 14, ice: 15, dragon: 16, dark: 17, fairy: 18 };
const generationRanges = { 1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493], 5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025] };
const getGeneration = (id) => Object.entries(generationRanges).find(([, [start, end]]) => id >= start && id <= end)?.[0] || "1";
const isExcludedForm = (name) => /(^|-)g(?:max|igantamax)(-|$)|(^|-)eternamax(-|$)/i.test(name);
const specialPokemonArtwork = {
  koraidon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1007.png",
  miraidon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1008.png",
};
const getSpecialPokemonArtwork = (name) => specialPokemonArtwork[name] || (name.startsWith("koraidon-") ? specialPokemonArtwork.koraidon : name.startsWith("miraidon-") ? specialPokemonArtwork.miraidon : null);
const showdownDexSprite = (pokemon) => {
  const name = showdownPokemonName(pokemon);
  return getSpecialPokemonArtwork(name) || `https://play.pokemonshowdown.com/sprites/dex/${name}.png`;
};
const fallbackPokemonSprite = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const moveTypeNames = { ...typeNames, Dark: "Sombrio" };
const categoryNames = { physical: "Físico", special: "Especial", status: "Status" };
const typeChart = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Grass: 2, Ice: 2, Bug: 2, Steel: 2, Fire: 0.5, Water: 0.5, Rock: 0.5, Dragon: 0.5 },
  Water: { Fire: 2, Ground: 2, Rock: 2, Water: 0.5, Grass: 0.5, Dragon: 0.5 },
  Electric: { Water: 2, Flying: 2, Ground: 0, Electric: 0.5, Grass: 0.5, Dragon: 0.5 },
  Grass: { Water: 2, Ground: 2, Rock: 2, Fire: 0.5, Grass: 0.5, Poison: 0.5, Flying: 0.5, Bug: 0.5, Dragon: 0.5, Steel: 0.5 },
  Ice: { Grass: 2, Ground: 2, Flying: 2, Dragon: 2, Fire: 0.5, Water: 0.5, Ice: 0.5, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Rock: 2, Dark: 2, Steel: 2, Ghost: 0, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Fairy: 0.5 },
  Poison: { Grass: 2, Fairy: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0 },
  Ground: { Fire: 2, Electric: 2, Poison: 2, Rock: 2, Steel: 2, Flying: 0, Grass: 0.5, Bug: 0.5 },
  Flying: { Grass: 2, Fighting: 2, Bug: 2, Electric: 0.5, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Steel: 0.5, Dark: 0 },
  Bug: { Grass: 2, Psychic: 2, Dark: 2, Fire: 0.5, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Ghost: 0.5, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Flying: 2, Bug: 2, Fighting: 0.5, Ground: 0.5, Steel: 0.5 },
  Ghost: { Psychic: 2, Ghost: 2, Normal: 0, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Psychic: 2, Ghost: 2, Fighting: 0.5, Dark: 0.5, Fairy: 0.5 },
  Steel: { Ice: 2, Rock: 2, Fairy: 2, Fire: 0.5, Water: 0.5, Electric: 0.5, Steel: 0.5 },
  Fairy: { Fighting: 2, Dragon: 2, Dark: 2, Fire: 0.5, Poison: 0.5, Steel: 0.5 },
};

const getEffect = (move) => {
  const effect = move.effect_entries?.find((entry) => entry.language.name === "en")?.short_effect;
  return (effect || move.flavor_text_entries?.find((entry) => entry.language.name === "en")?.flavor_text || "Efeito não informado.")
    .replace(/\$effect_chance/g, move.effect_chance ?? "")
    .replace(/\s+/g, " ");
};

const pokemonDataCache = new Map();
const evolutionChainCache = new Map();
const loadPokemonData = async (pokemonId) => {
  if (!pokemonDataCache.has(pokemonId)) {
    pokemonDataCache.set(pokemonId, fetch(`${apiBase}/pokemon/${pokemonId}`).then((response) => {
      if (!response.ok) throw new Error("Não foi possível carregar os dados do Pokémon.");
      return response.json();
    }));
  }
  return pokemonDataCache.get(pokemonId);
};
const getEvolutionLeaves = (chainNode, leaves = new Set()) => {
  if (!chainNode?.evolves_to?.length) leaves.add(chainNode.species.name.toLowerCase());
  chainNode?.evolves_to?.forEach((next) => getEvolutionLeaves(next, leaves));
  return leaves;
};
const isFinalEvolution = async (pokemon) => {
  const data = await loadPokemonData(pokemon.id);
  const speciesResponse = await fetch(data.species.url);
  if (!speciesResponse.ok) return true;
  const species = await speciesResponse.json();
  const chainUrl = species.evolution_chain?.url;
  if (!chainUrl) return true;
  if (!evolutionChainCache.has(chainUrl)) {
    evolutionChainCache.set(chainUrl, fetch(chainUrl).then((response) => response.json()).then(({ chain }) => getEvolutionLeaves(chain)));
  }
  const finalNames = await evolutionChainCache.get(chainUrl);
  return finalNames.has(pokemon.name.toLowerCase());
};

const loadBattleApiSnapshot = async () => {
  try {
    const response = await fetch(`${battleApiBase}/battle/battle`, { signal: AbortSignal.timeout(3500) });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

const loadPokemonMoves = async (pokemonId) => {
  const data = await loadPokemonData(pokemonId);
  return data.moves
    .filter(({ version_group_details }) =>
      version_group_details.some(({ move_learn_method }) =>
        ["level-up", "machine", "egg", "tutor"].includes(move_learn_method.name),
      ),
    )
    .map(({ move }) => move)
    .sort((a, b) => a.name.localeCompare(b.name));
};

const getPokemonStats = (data) => Object.fromEntries(data.stats.map(({ stat, base_stat }) => [stat.name, base_stat]));

const loadMove = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar os dados do golpe.");
  const move = await response.json();
  return {
    id: move.id,
    name: move.name,
    type: move.type.name,
    power: move.power,
    accuracy: move.accuracy,
    pp: move.pp,
    effectChance: move.effect_chance,
    category: move.damage_class.name,
    target: move.target?.name || "selected-pokemon",
    artwork: moveArtworkSymbols[move.type.name] || "✦",
    statChanges: move.stat_changes?.map(({ stat, change }) => ({ stat: stat.name, change })) || [],
    effect: getEffect(move),
  };
};

function MoveArtwork({ move = {}, small = false }) {
  const type = move.type || "normal";
  return <span className={`move-artwork type-${type} ${small ? "small" : ""}`} aria-hidden="true"><img src={`${typeSpriteBase}/${typeIds[type] || 1}.png`} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /><span>{move.artwork || moveArtworkSymbols[type] || "✦"}</span></span>;
}

function TypeSprite({ type, small = false }) {
  const normalizedType = String(type || "normal").toLowerCase();
  const label = moveTypeNames[normalizedType] || normalizedType;
  return <img className={`type-sprite ${small ? "small" : ""}`} src={`${typeSpriteBase}/${typeIds[normalizedType] || 1}.png`} alt={label} title={label} />;
}

function TypeSprites({ types = [], small = false }) {
  return <span className="type-sprites">{types.map((type) => <TypeSprite key={type} type={type} small={small} />)}</span>;
}

function PokemonImage({ pokemon, className = "", alt = "" }) {
  const sources = [...new Set([pokemon.image, getSpecialPokemonArtwork(showdownPokemonName(pokemon)), fallbackPokemonSprite(pokemon.id), `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`, pokemon.baseId && fallbackPokemonSprite(pokemon.baseId)].filter(Boolean))];
  const [sourceIndex, setSourceIndex] = useState(0);
  useEffect(() => setSourceIndex(0), [pokemon.id, pokemon.image]);
  return <img className={className} src={sources[sourceIndex]} alt={alt || pokemon.name} onError={() => setSourceIndex((current) => Math.min(current + 1, sources.length - 1))} />;
}

const trainerNames = ["Rafael", "Bianca", "Caio", "Lívia", "Diego", "Maya", "Theo", "Helena", "Bruno", "Nina", "Enzo", "Clara"];
const trainerSprites = ["acetrainer-gen1", "acetrainerf-gen1", "beauty-gen1", "bugcatcher-gen1", "fisher-gen1", "hiker-gen1", "lass-gen1", "schoolboy-gen4", "scientist-gen1", "swimmer-gen1", "youngster-gen1"];
const randomItems = (items, amount) => [...items].sort(() => Math.random() - 0.5).slice(0, amount);
const moveLabel = (move) => move.name.replaceAll("-", " ");
const showdownPokemonName = (pokemon) => pokemon.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("♀", "-f").replace("♂", "-m").replace(/[’.' ]/g, "").replace("mr-mime", "mr-mime");
const getCorrectedPokemonTypes = (pokemon, types = []) => {
  const name = String(pokemon?.name || "").toLowerCase();
  if (/^dragonite(?:-mega(?:-[xy])?)?$/.test(name)) return ["Dragon", "Flying"];
  return types;
};
const showdownPokemonSprite = (pokemon) => {
  const name = showdownPokemonName(pokemon);
  return getSpecialPokemonArtwork(name) || `https://play.pokemonshowdown.com/sprites/ani/${name}.gif`;
};
const showdownTrainerSprite = (name) => `https://play.pokemonshowdown.com/sprites/trainers/${name}.png`;
const loadTrainerSpritePool = async () => {
  try {
    const response = await fetch("https://play.pokemonshowdown.com/sprites/trainers/?view=dir");
    if (!response.ok) throw new Error("Diretório indisponível");
    const html = await response.text();
    const names = [...html.matchAll(/href=["']([^"']+\.png)["']/gi)]
      .map((match) => decodeURIComponent(match[1].split("/").pop().replace(/\.png$/i, "")))
      .filter((name) => name && !name.includes("?"));
    return names.length ? [...new Set(names)] : trainerSprites;
  } catch {
    return trainerSprites;
  }
};
const animationSymbols = { fire: "✦", water: "💧", electric: "ϟ", ice: "❄", grass: "✿", psychic: "✧", fighting: "✚", rock: "◆", ground: "◈", flying: "➤", bug: "✹", poison: "☠", ghost: "☾", dragon: "◇", dark: "☽", steel: "⬢", fairy: "✦", normal: "✦" };
const moveArtworkSymbols = { fire: "🔥", water: "💦", electric: "⚡", ice: "❄️", grass: "🌿", psychic: "🔮", fighting: "🥊", rock: "🪨", ground: "🌋", flying: "🌪️", bug: "🦋", poison: "☠️", ghost: "👻", dragon: "🐉", dark: "🌑", steel: "⚙️", fairy: "✨", normal: "💥" };
const attackEffectAssets = {
  fire: "https://img.craftpix.net/2023/11/Free-Flame-Effects-Sprite-Pack.gif",
  water: "https://img.craftpix.net/2023/11/Free-Water-Effects-Sprite-Pack.gif",
};

const createRandomOpponent = async (name, id, trainerSprite, catalog) => {
  const selectedPokemon = randomItems(catalog, 6);
  const team = await Promise.all(selectedPokemon.map(async (pokemon) => {
    const data = await loadPokemonData(pokemon.id);
    return { ...pokemon, types: getCorrectedPokemonTypes(pokemon, data.types.map(({ type }) => type.name.replace(/^./, (letter) => letter.toUpperCase()))), level: 100, stats: getPokemonStats(data), moves: randomItems(data.moves.filter(({ version_group_details }) => version_group_details.some(({ move_learn_method }) => ["level-up", "machine", "egg", "tutor"].includes(move_learn_method.name))).map(({ move }) => move), 4) };
  }));
  return { id, name, isUser: false, trainerSprite, team };
};

const createMatches = (trainers) =>
  Array.from({ length: trainers.length / 2 }, (_, index) => ({
    id: `${trainers[index * 2].id}-${trainers[index * 2 + 1].id}`,
    a: trainers[index * 2],
    b: trainers[index * 2 + 1],
    winner: null,
  }));

const calculateTeamPower = (trainer) => trainer.team.reduce((total, pokemon) => total + pokemon.id + pokemon.moves.length * 18, 0);
const getBattleStat = (pokemon, stat) => Math.floor(((2 * (pokemon.stats?.[stat] || 60) + 31) * (pokemon.level || 100)) / 100) + 5;
const getMaxHp = (pokemon) => Math.floor(((2 * (pokemon.stats?.hp || 60) + 31) * (pokemon.level || 100)) / 100) + (pokemon.level || 100) + 10;
const getTypeMultiplier = (moveType, targetTypes) => targetTypes.reduce((multiplier, targetType) => multiplier * (typeChart[moveType]?.[targetType] ?? 1), 1);
const getStageMultiplier = (stage = 0) => stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
const applyStatChanges = (boosts, changes) => changes.reduce((next, { stat, change }) => ({ ...next, [stat]: Math.max(-6, Math.min(6, (next[stat] || 0) + change)) }), boosts);
const getEffectivenessMessage = (multiplier) => multiplier === 0 ? "Não afeta o alvo. (0×)" : multiplier >= 4 ? "É super efetivo! (4×)" : multiplier >= 2 ? "É super efetivo! (2×)" : multiplier < 1 ? `Não é muito eficaz... (${multiplier}×)` : "Efeito neutro (1×).";
const formatBoostName = (stat) => ({ attack: "Ataque", defense: "Defesa", "special-attack": "At. Especial", "special-defense": "Def. Especial", speed: "Velocidade", accuracy: "Precisão", evasion: "Evasão" }[stat] || stat);
const formatBoosts = (boosts) => Object.entries(boosts || {}).filter(([, value]) => value).map(([stat, value]) => `${formatBoostName(stat)} ${value > 0 ? "+" : ""}${value}`);
const getAttackBoost = (move, boosts) => move.category === "special" ? getStageMultiplier(boosts["special-attack"]) : getStageMultiplier(boosts.attack);
const getDefenseBoost = (move, boosts) => move.category === "special" ? getStageMultiplier(boosts["special-defense"]) : getStageMultiplier(boosts.defense);
const statusLabels = { par: "PAR", brn: "BRN", slp: "SLP", frz: "FRZ", psn: "PSN", tox: "TOX" };
const statusNames = { par: "paralisado", brn: "queimado", slp: "adormecido", frz: "congelado", psn: "envenenado", tox: "envenenado gravemente" };
const emptyStatus = () => ({ condition: null, sleepTurns: 0, toxicTurns: 0 });
const getMoveStatus = (move) => {
  const text = `${move.name || ""} ${move.effect || ""}`.toLowerCase();
  if (/paraly|paralis|thunder wave|stun spore/.test(text)) return "par";
  if (/burn|queim|will-o-wisp/.test(text)) return "brn";
  if (/sleep|sono|spore|hypnosis|sing/.test(text)) return "slp";
  if (/freeze|congel|ice beam|blizzard/.test(text) && /freeze|congel/.test(text)) return "frz";
  if (/badly poison|toxic|tóxic/.test(text)) return "tox";
  if (/poison|veneno|sludge|toxic/.test(text)) return "psn";
  return null;
};
const moveTargetsSelf = (move) => ["user", "user-or-ally", "users-field", "ally"].includes(move.target);
const canAct = (status, move) => {
  if (!status?.condition) return { allowed: true, status };
  if (status.condition === "par" && Math.random() < 0.25) return { allowed: false, message: "está totalmente paralisado!", status };
  if (status.condition === "slp") {
    if (status.sleepTurns <= 0) return { allowed: true, status: { ...status, condition: null }, message: "acordou!" };
    return { allowed: false, status: { ...status, sleepTurns: status.sleepTurns - 1 }, message: "está dormindo!" };
  }
  if (status.condition === "frz") {
    if (move.type === "fire" || Math.random() < 0.2) return { allowed: true, status: { ...status, condition: null }, message: "descongelou!" };
    return { allowed: false, status, message: "está congelado!" };
  }
  return { allowed: true, status };
};
const getResidualDamage = (pokemon, status) => {
  if (!status?.condition) return 0;
  const maxHp = getMaxHp(pokemon);
  if (status.condition === "brn") return Math.max(1, Math.floor(maxHp / 16));
  if (status.condition === "psn") return Math.max(1, Math.floor(maxHp / 8));
  if (status.condition === "tox") return Math.max(1, Math.floor(maxHp * Math.max(1, status.toxicTurns || 1) / 16));
  return 0;
};
const applyMoveStatus = (status, move) => {
  const condition = getMoveStatus(move);
  if (!condition || status.condition) return status;
  if (move.effectChance && Math.random() * 100 >= move.effectChance) return status;
  return { condition, sleepTurns: condition === "slp" ? 1 + Math.floor(Math.random() * 7) : 0, toxicTurns: condition === "tox" ? 1 : 0 };
};
const getDamage = (attacker, move, defender, attackerBoosts = {}, defenderBoosts = {}) => {
  if (move.category === "status") return 0;
  const level = attacker.level || 50;
  const power = move.power || 40;
  const attackStat = getBattleStat(attacker, move.category === "special" ? "special-attack" : "attack") * (attacker.status?.condition === "brn" && move.category === "physical" ? 0.5 : 1);
  const defenseStat = getBattleStat(defender, move.category === "special" ? "special-defense" : "defense");
  const multiplier = getTypeMultiplier(move.type, defender.types);
  if (multiplier === 0) return 0;
  const baseDamage = Math.floor(Math.floor((Math.floor((2 * level) / 5 + 2) * power * attackStat * getAttackBoost(move, attackerBoosts) / (defenseStat * getDefenseBoost(move, defenderBoosts))) / 50) + 2);
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  return Math.max(1, Math.floor(baseDamage * stab * multiplier * (0.85 + Math.random() * 0.15)));
};
const getNextAvailableIndex = (team, fainted) => team.findIndex((_, index) => !fainted.includes(index));

function App() {
  const [page, setPage] = useState("team");
  const [team, setTeam] = useState([]);
  const [showToggles, setShowToggles] = useState(true);
  const [analysis, setAnalysis] = useState(false);
  const [query, setQuery] = useState("");
  const [pokemonCatalog, setPokemonCatalog] = useState(pokemonList);
  const [selectedGenerations, setSelectedGenerations] = useState([]);
  const [showGenerations, setShowGenerations] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showTypes, setShowTypes] = useState(false);
  const [movesByPokemon, setMovesByPokemon] = useState({});
  const [chosenMoves, setChosenMoves] = useState({});
  const [libraryView, setLibraryView] = useState(null);
  const [savedTeams, setSavedTeams] = useState(() => JSON.parse(localStorage.getItem("pokemon-saved-teams") || "[]"));
  const [box, setBox] = useState(() => JSON.parse(localStorage.getItem("pokemon-box") || "[]"));
  useEffect(() => localStorage.setItem("pokemon-saved-teams", JSON.stringify(savedTeams)), [savedTeams]);
  useEffect(() => localStorage.setItem("pokemon-box", JSON.stringify(box)), [box]);
  useEffect(() => {
    let cancelled = false;
    const loadCatalog = async () => {
      try {
        const response = await fetch(`${apiBase}/pokemon?limit=2000`);
        const { results } = await response.json();
        const entries = results.map((entry) => ({ ...entry, id: Number(entry.url.match(/\/pokemon\/(\d+)\/$/)?.[1] || 0) })).filter((entry) => entry.id && !isExcludedForm(entry.name));
        const baseEntries = entries.filter((entry) => entry.id <= 1025);
        const baseNames = baseEntries.map((entry) => entry.name).sort((a, b) => b.length - a.length);
        const catalog = entries.map((entry) => {
          const baseName = baseNames.find((name) => entry.name === name || entry.name.startsWith(`${name}-`));
          const baseEntry = baseEntries.find((item) => item.name === baseName);
          const baseId = baseEntry?.id || entry.id;
          const original = pokemonList.find((pokemon) => pokemon.id === baseId);
          const types = getCorrectedPokemonTypes({ name: entry.name }, original?.types || []);
          return original ? { ...original, id: entry.id, name: entry.name, baseId, types, image: showdownDexSprite({ name: entry.name }) } : { id: entry.id, baseId, name: entry.name, types, image: showdownDexSprite({ name: entry.name }) };
        });
        if (cancelled) return;
        setPokemonCatalog(catalog);
        for (let index = 0; index < catalog.length; index += 20) {
          const batch = catalog.slice(index, index + 20);
          const enriched = await Promise.all(batch.map(async (pokemon) => {
            if (pokemon.types?.length) return pokemon;
            try {
              const data = await loadPokemonData(pokemon.id);
              return { ...pokemon, types: getCorrectedPokemonTypes(pokemon, data.types.map(({ type }) => type.name.replace(/^./, (letter) => letter.toUpperCase()))) };
            } catch {
              return pokemon;
            }
          }));
          if (cancelled) return;
          setPokemonCatalog((current) => current.map((pokemon) => enriched.find((item) => item.id === pokemon.id) || pokemon));
        }
      } catch {
        if (!cancelled) setPokemonCatalog(pokemonList);
      }
    };
    loadCatalog();
    return () => { cancelled = true; };
  }, []);
  const options = useMemo(
    () =>
      pokemonCatalog.filter((pokemon) =>
        (selectedGenerations.length === 0 || selectedGenerations.includes(getGeneration(pokemon.baseId || pokemon.id))) &&
        (selectedTypes.length === 0 || pokemon.types?.some((type) => selectedTypes.includes(type))) &&
        pokemon.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [pokemonCatalog, query, selectedGenerations, selectedTypes],
  );
  const hydratePokemon = async (pokemon) => {
    if (pokemon.types?.length) return { ...pokemon, types: getCorrectedPokemonTypes(pokemon, pokemon.types) };
    try {
      const data = await loadPokemonData(pokemon.id);
      return { ...pokemon, types: getCorrectedPokemonTypes(pokemon, data.types.map(({ type }) => type.name.replace(/^./, (letter) => letter.toUpperCase()))) };
    } catch {
      return pokemon;
    }
  };
  const toggle = async (pokemon) => {
    if (team.some((item) => item.id === pokemon.id)) {
      setTeam((current) => current.filter((item) => item.id !== pokemon.id));
      return;
    }
    if (team.length >= 6) return;
    setTeam((current) => [...current, pokemon]);
    const hydrated = await hydratePokemon(pokemon);
    setTeam((current) => current.map((item) => item.id === pokemon.id ? hydrated : item));
  };
  const randomize = async () => {
    const selected = [...options].sort(() => Math.random() - 0.5).slice(0, 6);
    setTeam(await Promise.all(selected.map(hydratePokemon)));
  };
  const saveCurrentTeam = () => {
    if (!team.length) return;
    const defaultName = `Time ${savedTeams.length + 1}`;
    const name = window.prompt("Nome do time:", defaultName)?.trim();
    if (!name) return;
    setSavedTeams((current) => [...current, { id: Date.now(), name, team }]);
    setLibraryView("teams");
  };
  const loadSavedTeam = (savedTeam) => {
    setTeam(savedTeam.team);
    setPage("team");
    setLibraryView(null);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="pokeball-logo">
          <span />
        </div>
        <h1>Pokémon Team Builder</h1>
        <div className="top-links"></div>
      </header>
      <LibraryMenu libraryView={libraryView} setLibraryView={setLibraryView} saveCurrentTeam={saveCurrentTeam} />
      {libraryView === "teams" && <SavedTeamsPage savedTeams={savedTeams} onLoad={loadSavedTeam} onDelete={(id) => setSavedTeams((current) => current.filter((savedTeam) => savedTeam.id !== id))} />}
      {libraryView === "box" && <BoxPage box={box} pokemonCatalog={pokemonCatalog} onCapture={(pokemon) => setBox((current) => current.some((item) => item.id === pokemon.id) ? current : [...current, pokemon])} onRemove={(id) => setBox((current) => current.filter((pokemon) => pokemon.id !== id))} onAddToTeam={(pokemon) => { if (team.length < 6 && !team.some((item) => item.id === pokemon.id)) setTeam((current) => [...current, pokemon]); }} />}
      <div className={page === "team" ? "" : "page-hidden"}>
      <div className={libraryView ? "page-hidden" : ""}>
      <div className="intro">
        <p>
          Use esta ferramenta para planejar sua equipe para uma partida no jogo.
          Clique em um Pokémon abaixo para adicioná-lo à sua equipe e clique
          novamente para removê-lo. Divirta-se e compartilhe com seus amigos e
          vizinhos!
        </p>
      </div>
      <section className="panel team-panel">
        <h2 className="team-title">Meu time <button className="save-team-button" onClick={saveCurrentTeam} disabled={!team.length} title="Salvar time completo" aria-label="Salvar time completo">♥</button></h2>
        <div className="team-slots">
          {Array.from({ length: 6 }, (_, index) => (
            <TeamSlot
              key={index}
              pokemon={team[index]}
              onClick={() => team[index] && toggle(team[index])}
            />
          ))}
        </div>
        <div className="actions">
          <button onClick={randomize}>Randomize Team</button>
          <button onClick={() => setAnalysis(!analysis)}>
            {analysis ? "Ocultar Análise" : "Análise da Equipe"}
          </button>
          <button onClick={() => setShowToggles(!showToggles)}>
            {showToggles ? "Ocultar Nomes" : "Mostra Nomes"}
          </button>
        </div>
        {analysis && <TeamAnalysis team={team} />}
      </section>
      <section className="panel options-panel">
        <h2>Opções</h2>
        <button className="filter-button">Filtros</button>
        <div className="generation">Gerações I–IX · {options.length} Pokémon disponíveis</div>
        <div className="generation-filter">
          <button className="generation-button" onClick={() => setShowGenerations((current) => !current)}>Gerações ▾</button>
          {showGenerations && <div className="generation-menu">{Object.keys(generationRanges).map((generation) => <label key={generation}><input type="checkbox" checked={selectedGenerations.includes(generation)} onChange={() => setSelectedGenerations((current) => current.includes(generation) ? current.filter((item) => item !== generation) : [...current, generation])} /> Geração {generation}</label>)}<small>Nenhuma seleção mostra todas as gerações. Você pode misturar gerações.</small></div>}
        </div>
        <div className="generation-filter type-filter">
          <button className="generation-button" onClick={() => setShowTypes((current) => !current)}>Tipos ▾</button>
          {showTypes && <div className="generation-menu">{allTypes.map((type) => <label key={type}><input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => setSelectedTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])} /> {typeNames[type] || type}</label>)}<small>Nenhuma seleção mostra todos os tipos.</small></div>}
        </div>
        <div className="search-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Pokémon..."
          />
        </div>
        <div className="pokemon-grid">
          {options.map((pokemon) => (
            <button
              className={`pokemon-option ${team.some((item) => item.id === pokemon.id) ? "selected" : ""}`}
              key={pokemon.id}
              onClick={() => toggle(pokemon)}
              title={pokemon.name}
            >
              <img src={pokemon.image} alt={pokemon.name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackPokemonSprite(pokemon.id); }} />
              <span>{showToggles ? pokemon.name : ""}</span>
              <small>{showToggles ? <TypeSprites types={pokemon.types} /> : ""}</small>
            </button>
          ))}
        </div>
      </section>
      <footer>Pokémon Team Builder · Kanto region</footer>
      </div>
      </div>
      {!libraryView && page === "moves" && <MovesPage team={team} movesByPokemon={movesByPokemon} setMovesByPokemon={setMovesByPokemon} chosenMoves={chosenMoves} setChosenMoves={setChosenMoves} />}
      {!libraryView && page === "battles" && <BattlesPage team={team} chosenMoves={chosenMoves} pokemonCatalog={pokemonCatalog} />}
      <BottomNav page={page} setPage={(nextPage) => { setPage(nextPage); setLibraryView(null); }} />
    </main>
  );
}

function LibraryMenu({ libraryView, setLibraryView, saveCurrentTeam }) {
  return <aside className="library-menu">
    <div className="library-menu-title">Minha coleção</div>
    <button className={libraryView === "teams" ? "active" : ""} onClick={() => setLibraryView(libraryView === "teams" ? null : "teams")}><span>▣</span> Times salvos</button>
    <button className={libraryView === "box" ? "active" : ""} onClick={() => setLibraryView(libraryView === "box" ? null : "box")}><span>▤</span> Minha Box</button>
    <button className="library-save" onClick={saveCurrentTeam}><span>＋</span> Salvar time atual</button>
  </aside>;
}

function SavedTeamsPage({ savedTeams, onLoad, onDelete }) {
  return <section className="collection-page"><div className="subpage-heading"><span className="section-label">Coleção</span><h2>Times salvos</h2><p>Guarde suas equipes para carregar novamente quando quiser.</p></div>{savedTeams.length ? <div className="saved-team-grid">{savedTeams.map((savedTeam) => <article className="saved-team-card" key={savedTeam.id}><div className="saved-team-heading"><strong>{savedTeam.name}</strong><small>{savedTeam.team.length}/6 Pokémon</small></div><div className="saved-team-pokemon">{savedTeam.team.map((pokemon) => <img key={pokemon.id} src={pokemon.image || showdownPokemonSprite(pokemon)} alt={pokemon.name} title={pokemon.name} />)}</div><div className="saved-team-actions"><button onClick={() => onLoad(savedTeam)}>Carregar</button><button onClick={() => onDelete(savedTeam.id)}>Excluir</button></div></article>)}</div> : <div className="collection-empty">Você ainda não salvou nenhum time.</div>}</section>;
}

function BoxPage({ box, pokemonCatalog, onCapture, onRemove, onAddToTeam }) {
  const [showPokedex, setShowPokedex] = useState(false);
  const [query, setQuery] = useState("");
  const [generationFilter, setGenerationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [evolutionFilter, setEvolutionFilter] = useState("all");
  const [finalEvolutionIds, setFinalEvolutionIds] = useState(() => new Set());
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const checkedEvolutionIds = useRef(new Set());
  const evolutionLoadingRef = useRef(false);
  useEffect(() => {
    if (evolutionFilter !== "final" || evolutionLoadingRef.current) return;
    let cancelled = false;
    const loadEvolutionFlags = async () => {
      const pending = pokemonCatalog.filter((pokemon) => !checkedEvolutionIds.current.has(pokemon.id));
      if (!pending.length) return;
      evolutionLoadingRef.current = true;
      setEvolutionLoading(true);
      for (let index = 0; index < pending.length; index += 20) {
        const batch = pending.slice(index, index + 20);
        const results = await Promise.all(batch.map(async (pokemon) => {
          try { return { id: pokemon.id, final: await isFinalEvolution(pokemon) }; } catch { return { id: pokemon.id, final: true }; }
        }));
        if (cancelled) { evolutionLoadingRef.current = false; return; }
        results.forEach(({ id }) => checkedEvolutionIds.current.add(id));
        setFinalEvolutionIds((current) => { const next = new Set(current); results.filter(({ final }) => final).forEach(({ id }) => next.add(id)); return next; });
      }
      evolutionLoadingRef.current = false;
      if (!cancelled) setEvolutionLoading(false);
    };
    loadEvolutionFlags();
    return () => { cancelled = true; };
  }, [evolutionFilter, pokemonCatalog]);
  const availablePokemon = pokemonCatalog.filter((pokemon) => pokemon.name.toLowerCase().includes(query.toLowerCase()) && (generationFilter === "all" || getGeneration(pokemon.baseId || pokemon.id) === generationFilter) && (typeFilter === "all" || pokemon.types?.includes(typeFilter)) && (evolutionFilter !== "final" || finalEvolutionIds.has(pokemon.id)));
  return <section className="collection-page"><div className="subpage-heading"><span className="section-label">Coleção</span><h2>Minha Box</h2><p>Seus Pokémon capturados ficam salvos individualmente nesta coleção.</p><button className="pokedex-open-button" onClick={() => setShowPokedex((current) => !current)}>{showPokedex ? "Fechar Pokédex" : "Abrir Pokédex"}</button></div>{showPokedex && <div className="pokedex-panel"><div className="pokedex-panel-heading"><strong>Pokédex</strong><small>Selecione um Pokémon para capturá-lo na sua Box.</small></div><div className="pokedex-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar Pokémon..." /><select value={generationFilter} onChange={(event) => setGenerationFilter(event.target.value)}><option value="all">Todas as gerações</option>{Object.keys(generationRanges).map((generation) => <option key={generation} value={generation}>Geração {generation}</option>)}</select><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Todos os tipos</option>{allTypes.map((type) => <option key={type} value={type}>{typeNames[type] || type}</option>)}</select><select value={evolutionFilter} onChange={(event) => setEvolutionFilter(event.target.value)}><option value="all">Todas as evoluções</option><option value="final">Apenas última evolução</option></select></div>{evolutionLoading && evolutionFilter === "final" && <div className="pokedex-loading">Identificando cadeias evolutivas...</div>}<div className="pokedex-grid">{availablePokemon.map((pokemon) => { const captured = box.some((item) => item.id === pokemon.id); return <button className={captured ? "captured" : ""} key={pokemon.id} onClick={() => onCapture(pokemon)} title={captured ? `${pokemon.name} já está na Box` : `Capturar ${pokemon.name}`}><PokemonImage pokemon={pokemon} alt="" /><span>{pokemon.name}</span>{captured && <small>NA BOX</small>}</button>; })}</div></div>}{box.length ? <div className="box-grid">{box.map((pokemon) => <article className="box-pokemon" key={pokemon.id}><PokemonImage pokemon={pokemon} alt={pokemon.name} /><strong>{pokemon.name}</strong><small>{formatTypes(pokemon.types || [])}</small><button onClick={() => onAddToTeam(pokemon)}>Adicionar ao time</button><button className="box-remove-button" onClick={() => onRemove(pokemon.id)}>Remover da Box</button></article>)}</div> : <div className="collection-empty">Sua Box está vazia. Abra a Pokédex e selecione Pokémon para capturá-los.</div>}</section>;
}

function MovesPage({ team, movesByPokemon, setMovesByPokemon, chosenMoves, setChosenMoves }) {
  const [openPokemon, setOpenPokemon] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [loadingPokemon, setLoadingPokemon] = useState(null);
  const [loadingMove, setLoadingMove] = useState(null);
  const [moveFilter, setMoveFilter] = useState("");
  const [error, setError] = useState("");

  const openMovePicker = async (pokemon, slot) => {
    setError("");
    setMoveFilter("");
    setOpenPokemon(openPokemon === pokemon.id && activeSlot === slot ? null : pokemon.id);
    setActiveSlot(slot);
    if (movesByPokemon[pokemon.id]) return;
    setLoadingPokemon(pokemon.id);
    try {
      const moves = await loadPokemonMoves(pokemon.id);
      setMovesByPokemon((current) => ({ ...current, [pokemon.id]: moves }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingPokemon(null);
    }
  };

  const chooseMove = async (pokemon, slot, move) => {
    setError("");
    setLoadingMove(`${pokemon.id}-${slot}`);
    try {
      const details = await loadMove(move.url);
      setChosenMoves((current) => {
        const next = [...(current[pokemon.id] || [])];
        next[slot] = details;
        return { ...current, [pokemon.id]: next };
      });
      setOpenPokemon(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingMove(null);
    }
  };

  const randomizeMoves = async (pokemon) => {
    setError("");
    setLoadingMove(`${pokemon.id}-random`);
    try {
      const available = movesByPokemon[pokemon.id] || await loadPokemonMoves(pokemon.id);
      if (!movesByPokemon[pokemon.id]) setMovesByPokemon((current) => ({ ...current, [pokemon.id]: available }));
      const randomMoves = await Promise.all(randomItems(available, 4).map((move) => loadMove(move.url)));
      setChosenMoves((current) => ({ ...current, [pokemon.id]: randomMoves }));
      setOpenPokemon(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingMove(null);
    }
  };

  return <section className="subpage"><div className="subpage-heading"><span className="section-label">Preparação</span><h2>Editar movimentos</h2><p>Monte os quatro golpes de cada Pokémon da sua equipe. Os dados vêm da PokéAPI.</p></div>{error && <div className="api-error">{error}</div>}{team.length ? <div className="moves-list">{team.map((pokemon) => <div className="move-card" key={pokemon.id}><img src={pokemon.image} alt={pokemon.name} /><div><h3>{pokemon.name}</h3><small>{formatTypes(pokemon.types)}</small><button className="card-random-button" onClick={() => randomizeMoves(pokemon)} disabled={loadingMove === `${pokemon.id}-random`}>{loadingMove === `${pokemon.id}-random` ? "Sorteando..." : "🎲 Randomizar golpes"}</button></div><div className="move-slots">{Array.from({ length: 4 }, (_, slot) => { const selected = chosenMoves[pokemon.id]?.[slot]; return <div className="move-slot" key={slot}><button className={selected ? "selected-move" : ""} onClick={() => openMovePicker(pokemon, slot)}>{selected ? <><strong>{selected.name.replaceAll("-", " ")}</strong><small>{moveTypeNames[selected.type] || selected.type} · {categoryNames[selected.category]}</small></> : loadingMove === `${pokemon.id}-${slot}` ? "Carregando..." : "Escolher golpe"}</button>{selected && <p className="move-effect">{selected.effect}</p>}{openPokemon === pokemon.id && activeSlot === slot && <div className="move-picker"><input autoFocus value={moveFilter} placeholder="Filtrar golpes..." onChange={(event) => setMoveFilter(event.target.value.toLowerCase())} />{loadingPokemon === pokemon.id ? <span>Buscando golpes...</span> : <>{(movesByPokemon[pokemon.id] || []).filter((move) => move.name.includes(moveFilter)).slice(0, 80).map((move) => <button key={move.name} onClick={() => chooseMove(pokemon, slot, move)}>{move.name.replaceAll("-", " ")}</button>)}<button className="random-move-button" onClick={() => randomizeMoves(pokemon)} disabled={loadingMove === `${pokemon.id}-random`}>{loadingMove === `${pokemon.id}-random` ? "Sorteando..." : "🎲 Randomizar golpes"}</button></>}</div>}</div>; })}</div></div>)}</div> : <EmptyPage text="Adicione Pokémon ao seu time para editar os movimentos." />}</section>;
}

function BattlesPage({ team, chosenMoves, pokemonCatalog }) {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeBattle, setActiveBattle] = useState(null);
  const [battleLoading, setBattleLoading] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  const startTournament = async () => {
    setLoading(true);
    setError("");
    try {
      const userTeam = await Promise.all(team.map(async (pokemon) => {
        const pokemonData = await loadPokemonData(pokemon.id);
        let moves = chosenMoves[pokemon.id] || [];
        if (!moves.length) {
          const available = await loadPokemonMoves(pokemon.id);
          moves = await Promise.all(randomItems(available, 4).map((move) => loadMove(move.url)));
        }
        return { ...pokemon, level: 100, stats: getPokemonStats(pokemonData), moves };
      }));
      const names = randomItems(trainerNames, 7);
      const availableTrainerSprites = randomItems(await loadTrainerSpritePool(), 8);
      const opponents = await Promise.all(names.map((name, index) => createRandomOpponent(name, `opponent-${index}`, availableTrainerSprites[index + 1] || trainerSprites[index % trainerSprites.length], pokemonCatalog)));
      const trainers = randomItems([{ id: "user", name: "Você", isUser: true, trainerSprite: availableTrainerSprites[0] || trainerSprites[0], team: userTeam }, ...opponents], 8);
      setTournament({ rounds: [createMatches(trainers)], currentRound: 0, champion: null, eliminated: false });
    } catch (requestError) {
      setError(`Não foi possível preparar o torneio: ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const simulateRound = () => {
    if (!tournament || tournament.champion || tournament.eliminated) return;
    const currentMatches = tournament.rounds[tournament.currentRound];
    if (currentMatches.some((match) => !match.winner && (match.a.isUser || match.b.isUser))) {
      setError("Entre na sua batalha antes de avançar a rodada.");
      return;
    }
    const resolved = currentMatches.map((match) => {
      if (match.winner) return match;
      const powerA = calculateTeamPower(match.a);
      const powerB = calculateTeamPower(match.b);
      const chanceA = powerA / (powerA + powerB);
      const winner = Math.random() < chanceA ? match.a : match.b;
      return { ...match, winner };
    });
    const winners = resolved.map((match) => match.winner);
    const isFinal = winners.length === 1;
    setTournament((current) => ({
      ...current,
      rounds: isFinal ? current.rounds.map((round, index) => index === current.currentRound ? resolved : round) : [...current.rounds.map((round, index) => index === current.currentRound ? resolved : round), createMatches(winners)],
      currentRound: isFinal ? current.currentRound : current.currentRound + 1,
      champion: isFinal ? winners[0] : null,
    }));
  };

  const simulateOneMatch = () => {
    if (!tournament || tournament.champion || tournament.eliminated) return;
    const currentMatches = tournament.rounds[tournament.currentRound];
    const target = currentMatches.find((match) => !match.winner && !match.a.isUser && !match.b.isUser);
    if (!target) {
      setError("Não há uma luta de IA disponível nesta rodada.");
      return;
    }
    const winner = Math.random() < calculateTeamPower(target.a) / (calculateTeamPower(target.a) + calculateTeamPower(target.b)) ? target.a : target.b;
    const resolved = currentMatches.map((match) => match.id === target.id ? { ...match, winner } : match);
    if (!resolved.every((match) => match.winner)) {
      setTournament((current) => ({ ...current, rounds: current.rounds.map((round, index) => index === current.currentRound ? resolved : round) }));
      return;
    }
    const winners = resolved.map((match) => match.winner);
    const isFinal = winners.length === 1;
    setTournament((current) => ({
      ...current,
      rounds: isFinal ? current.rounds.map((round, index) => index === current.currentRound ? resolved : round) : [...current.rounds.map((round, index) => index === current.currentRound ? resolved : round), createMatches(winners)],
      currentRound: isFinal ? current.currentRound : current.currentRound + 1,
      champion: isFinal ? winners[0] : null,
    }));
  };

  const reviewNextMatch = () => {
    if (!tournament || activeBattle || tournament.champion || tournament.eliminated) return;
    const match = (tournament.rounds[tournament.currentRound] || []).find((item) => !item.winner && !item.a.isUser && !item.b.isUser);
    if (!match) {
      setError("Não há uma luta de IA disponível para revisar nesta rodada.");
      return;
    }
    beginReviewBattle(match);
  };

  const beginBattle = async (match) => {
    setBattleLoading(true);
    setError("");
    const player = match.a.isUser ? match.a : match.b;
    const enemy = match.a.isUser ? match.b : match.a;
    try {
      const enrichTrainer = async (trainer) => ({
        ...trainer,
        team: await Promise.all(trainer.team.map(async (pokemon) => ({
          ...pokemon,
          moves: await Promise.all(pokemon.moves.map((move) => move.url ? loadMove(move.url) : Promise.resolve(move))),
        }))),
      });
      const [enrichedPlayer, enrichedEnemy, battleApiSnapshot] = await Promise.all([enrichTrainer(player), enrichTrainer(enemy), loadBattleApiSnapshot()]);
      const playerPokemon = enrichedPlayer.team[0];
      const enemyPokemon = enrichedEnemy.team[0];
      setActiveBattle({
        matchId: match.id,
        player: enrichedPlayer,
        enemy: enrichedEnemy,
        playerIndex: 0,
        enemyIndex: 0,
        playerHp: getMaxHp(playerPokemon),
        enemyHp: getMaxHp(enemyPokemon),
        faintedPlayer: [],
        faintedEnemy: [],
        playerBoosts: { 0: {} },
        enemyBoosts: { 0: {} },
        playerStatuses: { 0: emptyStatus() },
        enemyStatuses: { 0: emptyStatus() },
        playerKOs: 0,
        playerSwitchTokens: 0,
        battleApiSnapshot,
        turn: 0,
        animations: [],
        resolving: false,
        log: [`${playerPokemon.name} entrou na batalha contra ${enemyPokemon.name}!`],
        finished: false,
      });
    } catch (requestError) {
      setError(`Não foi possível carregar os golpes da batalha: ${requestError.message}`);
    } finally {
      setBattleLoading(false);
    }
  };

  const beginReviewBattle = async (match) => {
    setBattleLoading(true);
    setError("");
    try {
      const enrichTrainer = async (trainer) => ({
        ...trainer,
        team: await Promise.all(trainer.team.map(async (pokemon) => ({
          ...pokemon,
          moves: await Promise.all(pokemon.moves.map((move) => move.url ? loadMove(move.url) : Promise.resolve(move))),
        }))),
      });
      const [player, enemy] = await Promise.all([enrichTrainer(match.a), enrichTrainer(match.b)]);
      const playerPokemon = player.team[0];
      const enemyPokemon = enemy.team[0];
      setActiveBattle({
        matchId: match.id,
        review: true,
        player,
        enemy,
        playerIndex: 0,
        enemyIndex: 0,
        playerHp: getMaxHp(playerPokemon),
        enemyHp: getMaxHp(enemyPokemon),
        faintedPlayer: [],
        faintedEnemy: [],
        playerBoosts: { 0: {} },
        enemyBoosts: { 0: {} },
        playerStatuses: { 0: emptyStatus() },
        enemyStatuses: { 0: emptyStatus() },
        playerKOs: 0,
        playerSwitchTokens: 0,
        turn: 0,
        animations: [],
        resolving: false,
        log: [`${playerPokemon.name} entrou na revisão contra ${enemyPokemon.name}!`],
        finished: false,
      });
    } catch (requestError) {
      setError(`Não foi possível revisar essa luta: ${requestError.message}`);
    } finally {
      setBattleLoading(false);
    }
  };

  const finishBattle = (winner) => {
    setTournament((current) => {
      if (!current) return current;
      const rounds = current.rounds.map((round, index) => index === current.currentRound ? round.map((match) => match.id === activeBattle.matchId ? { ...match, winner } : match) : round);
      return { ...current, rounds, eliminated: activeBattle.review ? current.eliminated : !winner.isUser && winner.id !== "user" };
    });
    setActiveBattle(null);
  };

  const playMove = (move) => {
    if (!activeBattle || activeBattle.finished || activeBattle.resolving) return;
    const playerPokemon = activeBattle.player.team[activeBattle.playerIndex];
    const enemyPokemon = activeBattle.enemy.team[activeBattle.enemyIndex];
    playerPokemon.status = activeBattle.playerStatuses[activeBattle.playerIndex] || emptyStatus();
    enemyPokemon.status = activeBattle.enemyStatuses[activeBattle.enemyIndex] || emptyStatus();
    const playerSpeed = getBattleStat(playerPokemon, "speed") * (playerPokemon.status.condition === "par" ? 0.5 : 1) * getStageMultiplier((activeBattle.playerBoosts[activeBattle.playerIndex] || {}).speed);
    const enemySpeed = getBattleStat(enemyPokemon, "speed") * (enemyPokemon.status.condition === "par" ? 0.5 : 1) * getStageMultiplier((activeBattle.enemyBoosts[activeBattle.enemyIndex] || {}).speed);
    const enemyMove = randomItems(enemyPokemon.moves, 1)[0];
    const actions = playerSpeed >= enemySpeed ? [{ side: "player", move }, { side: "enemy", move: enemyMove }] : [{ side: "enemy", move: enemyMove }, { side: "player", move }];
    let next = { ...activeBattle, turn: (activeBattle.turn || 0) + 1, resolving: true, animations: actions.map((action, index) => ({ id: `${activeBattle.turn}-${index}-${action.move.name}`, side: action.side, type: action.move.type, asset: attackEffectAssets[action.move.type], symbol: animationSymbols[action.move.type] || "✦" })), log: [...activeBattle.log, `--- Turno ${(activeBattle.turn || 0) + 1} ---`], playerBoosts: { ...activeBattle.playerBoosts }, enemyBoosts: { ...activeBattle.enemyBoosts }, playerStatuses: { ...activeBattle.playerStatuses }, enemyStatuses: { ...activeBattle.enemyStatuses } };

    for (const action of actions) {
      const attacker = action.side === "player" ? next.player.team[next.playerIndex] : next.enemy.team[next.enemyIndex];
      const defender = action.side === "player" ? next.enemy.team[next.enemyIndex] : next.player.team[next.playerIndex];
      const attackerIndex = action.side === "player" ? next.playerIndex : next.enemyIndex;
      const statuses = action.side === "player" ? next.playerStatuses : next.enemyStatuses;
      const statusResult = canAct(statuses[attackerIndex] || emptyStatus(), action.move);
      statuses[attackerIndex] = statusResult.status;
      if (statusResult.message) next.log.push(`${attacker.name} ${statusResult.message}`);
      if (!statusResult.allowed) continue;
      const attackerBoosts = action.side === "player" ? (next.playerBoosts[attackerIndex] || {}) : (next.enemyBoosts[attackerIndex] || {});
      const defenderBoosts = action.side === "player" ? (next.enemyBoosts[next.enemyIndex] || {}) : (next.playerBoosts[next.playerIndex] || {});
      const multiplier = getTypeMultiplier(action.move.type, defender.types);
      const damage = getDamage(attacker, action.move, defender, attackerBoosts, defenderBoosts);
      const prefix = action.side === "player" ? "Você" : "Adversário";
      const recipientSide = moveTargetsSelf(action.move) ? action.side : (action.side === "player" ? "enemy" : "player");
      const recipientIndex = recipientSide === "player" ? next.playerIndex : next.enemyIndex;
      const recipientBoosts = recipientSide === "player" ? (next.playerBoosts[recipientIndex] || {}) : (next.enemyBoosts[recipientIndex] || {});
      const boosts = applyStatChanges(recipientBoosts, action.move.statChanges);
      if (recipientSide === "player") next.playerBoosts[recipientIndex] = boosts;
      else next.enemyBoosts[recipientIndex] = boosts;
      next.log.push(`${prefix}: ${attacker.name} usou ${moveLabel(action.move)}${damage ? ` e causou ${damage} de dano.` : "."}`);
      next.log.push(`${getEffectivenessMessage(multiplier)}`);
      if (action.move.statChanges.length) next.log.push(`${recipientSide === action.side ? attacker.name : defender.name}: ${formatBoosts(boosts).join(", ") || "atributos alterados"}.`);
      if (action.side === "player") next.enemyHp = Math.max(0, next.enemyHp - damage);
      else next.playerHp = Math.max(0, next.playerHp - damage);
      const statusTargetSide = moveTargetsSelf(action.move) ? action.side : (action.side === "player" ? "enemy" : "player");
      const targetStatuses = statusTargetSide === "player" ? next.playerStatuses : next.enemyStatuses;
      const targetIndex = statusTargetSide === "player" ? next.playerIndex : next.enemyIndex;
      const newStatus = applyMoveStatus(targetStatuses[targetIndex] || emptyStatus(), action.move);
      if (newStatus.condition !== (targetStatuses[targetIndex] || {}).condition) {
        targetStatuses[targetIndex] = newStatus;
        next.log.push(`${defender.name} ficou ${statusNames[newStatus.condition]} (${statusLabels[newStatus.condition]}).`);
      }
      const targetHp = action.side === "player" ? next.enemyHp : next.playerHp;
      if (targetHp === 0) {
        const targetIsEnemy = action.side === "player";
        next.log.push(`${defender.name} desmaiou!`);
        const fainted = targetIsEnemy ? [...next.faintedEnemy, next.enemyIndex] : [...next.faintedPlayer, next.playerIndex];
        const targetTeam = targetIsEnemy ? next.enemy.team : next.player.team;
        next.pendingReplacement = { side: targetIsEnemy ? "enemy" : "player", fainted };
        if (targetIsEnemy) next.faintedEnemy = fainted;
        else next.faintedPlayer = fainted;
        if (targetIsEnemy) {
          next.playerKOs += 1;
          if (next.playerKOs % 2 === 0) next.playerSwitchTokens += 1;
        }
        break;
      }
    }
    if (!next.pendingReplacement) {
      for (const side of ["player", "enemy"]) {
        const index = side === "player" ? next.playerIndex : next.enemyIndex;
        const pokemon = side === "player" ? next.player.team[index] : next.enemy.team[index];
        const statuses = side === "player" ? next.playerStatuses : next.enemyStatuses;
        const currentStatus = statuses[index] || emptyStatus();
        const residual = getResidualDamage(pokemon, currentStatus);
        if (residual) {
          if (side === "player") next.playerHp = Math.max(0, next.playerHp - residual);
          else next.enemyHp = Math.max(0, next.enemyHp - residual);
          next.log.push(`${pokemon.name} sofreu ${residual} de dano por ${statusNames[currentStatus.condition]}.`);
          if (currentStatus.condition === "tox") statuses[index] = { ...currentStatus, toxicTurns: (currentStatus.toxicTurns || 1) + 1 };
          if ((side === "player" ? next.playerHp : next.enemyHp) === 0) {
            next.log.push(`${pokemon.name} desmaiou!`);
            const fainted = side === "player" ? [...next.faintedPlayer, index] : [...next.faintedEnemy, index];
            if (side === "player") next.faintedPlayer = fainted;
            else next.faintedEnemy = fainted;
            if (side === "enemy") {
              next.playerKOs += 1;
              if (next.playerKOs % 2 === 0) next.playerSwitchTokens += 1;
            }
            next.pendingReplacement = { side, fainted };
            break;
          }
        }
      }
    }
    setActiveBattle(next);
    window.setTimeout(() => {
      if (next.pendingReplacement) {
        const { side, fainted } = next.pendingReplacement;
        const targetTeam = side === "enemy" ? next.enemy.team : next.player.team;
        if (fainted.length === targetTeam.length) {
          finishBattle(side === "enemy" ? next.player : next.enemy);
          return;
        }
        const nextIndex = getNextAvailableIndex(targetTeam, fainted);
        const nextPokemon = targetTeam[nextIndex];
        setActiveBattle((current) => ({ ...current, resolving: false, pendingReplacement: null, ...(side === "enemy" ? { enemyIndex: nextIndex, enemyHp: getMaxHp(nextPokemon), enemyBoosts: { ...current.enemyBoosts, [nextIndex]: {} }, enemyStatuses: { ...current.enemyStatuses, [nextIndex]: emptyStatus() } } : { playerIndex: nextIndex, playerHp: getMaxHp(nextPokemon), playerBoosts: { ...current.playerBoosts, [nextIndex]: {} }, playerStatuses: { ...current.playerStatuses, [nextIndex]: emptyStatus() } }), log: [...current.log, `${nextPokemon.name} entrou na batalha!`] }));
        return;
      }
      setActiveBattle((current) => current ? { ...current, resolving: false } : current);
    }, 900);
  };

  useEffect(() => {
    if (!activeBattle?.review || activeBattle.resolving || activeBattle.finished) return undefined;
    const timer = window.setTimeout(() => {
      const pokemon = activeBattle.player.team[activeBattle.playerIndex];
      const move = randomItems(pokemon.moves, 1)[0];
      if (move) playMove(move);
    }, 850);
    return () => window.clearTimeout(timer);
  }, [activeBattle]);

  const switchPokemon = (nextIndex) => {
    if (!activeBattle || activeBattle.resolving || activeBattle.playerSwitchTokens < 1 || nextIndex === activeBattle.playerIndex || activeBattle.faintedPlayer.includes(nextIndex)) return;
    const nextPokemon = activeBattle.player.team[nextIndex];
    const enemyPokemon = activeBattle.enemy.team[activeBattle.enemyIndex];
    nextPokemon.status = activeBattle.playerStatuses[nextIndex] || emptyStatus();
    enemyPokemon.status = activeBattle.enemyStatuses[activeBattle.enemyIndex] || emptyStatus();
    const enemyMove = randomItems(enemyPokemon.moves, 1)[0];
    const enemyBoost = activeBattle.enemyBoosts[activeBattle.enemyIndex] || {};
    const damage = getDamage(enemyPokemon, enemyMove, nextPokemon, enemyBoost, activeBattle.playerBoosts[nextIndex] || {});
    const playerHp = Math.max(0, getMaxHp(nextPokemon) - damage);
    const enemyBoosts = { ...activeBattle.enemyBoosts, [activeBattle.enemyIndex]: applyStatChanges(enemyBoost, enemyMove.statChanges) };
    const playerStatuses = { ...activeBattle.playerStatuses, [nextIndex]: applyMoveStatus(activeBattle.playerStatuses[nextIndex] || emptyStatus(), enemyMove) };
    const log = [...activeBattle.log, `--- Turno ${(activeBattle.turn || 0) + 1} ---`, `Você trocou para ${nextPokemon.name}.`, `Adversário: ${enemyPokemon.name} usou ${moveLabel(enemyMove)} e causou ${damage} de dano.`, getEffectivenessMessage(getTypeMultiplier(enemyMove.type, nextPokemon.types))];
    const animations = [{ id: `${activeBattle.turn}-switch-${enemyMove.name}`, side: "enemy", type: enemyMove.type, asset: attackEffectAssets[enemyMove.type], symbol: animationSymbols[enemyMove.type] || "✦" }];
    if (enemyMove.statChanges.length) log.push(`${enemyPokemon.name}: ${formatBoosts(enemyBoosts[activeBattle.enemyIndex]).join(", ") || "atributos alterados"}.`);
    if (playerHp === 0) {
      const faintedPlayer = [...activeBattle.faintedPlayer, nextIndex];
      log.push(`${nextPokemon.name} desmaiou!`);
      if (faintedPlayer.length === activeBattle.player.team.length) {
        finishBattle(activeBattle.enemy);
        return;
      }
      const fallbackIndex = getNextAvailableIndex(activeBattle.player.team, faintedPlayer);
      const fallbackPokemon = activeBattle.player.team[fallbackIndex];
      setActiveBattle({ ...activeBattle, turn: (activeBattle.turn || 0) + 1, animations, playerIndex: fallbackIndex, playerHp: getMaxHp(fallbackPokemon), faintedPlayer, enemyBoosts, playerStatuses, playerSwitchTokens: activeBattle.playerSwitchTokens - 1, log: [...log, `${fallbackPokemon.name} entrou na batalha!`] });
      return;
    }
    setActiveBattle({ ...activeBattle, turn: (activeBattle.turn || 0) + 1, animations, playerIndex: nextIndex, playerHp, enemyBoosts, playerStatuses, playerSwitchTokens: activeBattle.playerSwitchTokens - 1, log: [...log, `Trocas disponíveis restantes: ${activeBattle.playerSwitchTokens - 1}.`] });
  };

  const roundNames = ["Quartas de final", "Semifinais", "Grande final"];
  const currentMatches = tournament?.rounds[tournament.currentRound] || [];
  return <section className="subpage"><div className="subpage-heading"><span className="section-label">Arena</span><h2>Torneio Pokémon</h2><p>Batalhas por turnos inspiradas nos jogos oficiais: escolha golpes, acompanhe o HP, troque Pokémon e avance na chave.</p></div>{error && <div className="api-error">{error}</div>}{!team.length ? <EmptyPage text="Adicione Pokémon ao seu time antes de entrar no torneio." /> : <><div className="tournament-actions"><button className="battle-button" onClick={startTournament} disabled={loading || battleLoading}>{loading ? "Montando torneio..." : tournament ? "Novo torneio" : "Montar torneio"}</button>{tournament && !tournament.champion && !tournament.eliminated && <><button className="secondary-button" onClick={() => setReviewMode((current) => !current)}>{reviewMode ? "Sair do modo review" : "Modo review"}</button><button className="secondary-button" onClick={simulateRound}>Simular todas</button><button className="secondary-button" onClick={simulateOneMatch}>Simular uma</button>{reviewMode && <button className="secondary-button" onClick={reviewNextMatch}>Ver próxima luta</button>}</>}</div>{battleLoading && <div className="loading-card">Carregando os golpes da batalha...</div>}{activeBattle && <BattleArena battle={activeBattle} onMove={playMove} onSwitch={switchPokemon} />}{tournament && !activeBattle && <><div className="round-title"><span>{tournament.champion ? "Torneio encerrado" : tournament.eliminated ? "Você foi eliminado" : roundNames[tournament.currentRound]}</span><small>{tournament.champion ? `Campeão: ${tournament.champion.name}` : `${currentMatches.length} batalha(s)`}</small></div><div className="tournament-grid">{currentMatches.map((match) => <TournamentMatch key={match.id} match={match} onBattle={beginBattle} reviewMode={reviewMode} onReview={beginReviewBattle} />)}</div>{tournament.champion && <div className="champion-card">🏆 <strong>{tournament.champion.name} venceu o torneio!</strong><span>O campeão terminou com uma equipe de {tournament.champion.team.length} Pokémon.</span></div>}{tournament.eliminated && <div className="elimination-card">Seu time foi derrotado. Monte um novo torneio para tentar novamente.</div>}</>}</>}</section>;
}

function BoostDisplay({ boosts }) {
  const activeBoosts = formatBoosts(boosts);
  return activeBoosts.length ? <div className="boost-display">{activeBoosts.map((boost) => <span key={boost}>{boost}</span>)}</div> : null;
}

function StatusDisplay({ status }) {
  if (!status?.condition) return null;
  return <span className={`battle-condition condition-${status.condition}`}>{statusLabels[status.condition]}</span>;
}

function TeamIndicators({ team, fainted, current }) {
  return <div className="team-indicators" aria-label={`${team.length - fainted.length} Pokémon restantes`}>
    {team.map((pokemon, index) => <span className={`${fainted.includes(index) ? "defeated" : ""} ${current === index ? "active" : ""}`} key={`${pokemon.id}-${index}`} title={fainted.includes(index) ? `${pokemon.name} derrotado` : pokemon.name}>●</span>)}
  </div>;
}

function StatsSummary({ pokemon }) {
  const stats = pokemon.stats || {};
  return <div className="stats-summary"><span>ATK {stats.attack || "—"}</span><span>DEF {stats.defense || "—"}</span><span>SpA {stats["special-attack"] || "—"}</span><span>SpD {stats["special-defense"] || "—"}</span><span>SPD {stats.speed || "—"}</span></div>;
}

function BattleSprite({ pokemon, enemy = false }) {
  const [fallback, setFallback] = useState(false);
  return <img className={`battle-sprite ${enemy ? "enemy-sprite" : ""}`} src={fallback ? fallbackPokemonSprite(pokemon.id) : showdownPokemonSprite(pokemon)} onError={() => setFallback(true)} alt={pokemon.name} />;
}

function BattleArena({ battle, onMove, onSwitch }) {
  const logRef = useRef(null);
  const [menu, setMenu] = useState("main");
  const playerPokemon = battle.player.team[battle.playerIndex];
  const enemyPokemon = battle.enemy.team[battle.enemyIndex];
  const playerMaxHp = getMaxHp(playerPokemon);
  const enemyMaxHp = getMaxHp(enemyPokemon);
  const hpPercent = (value, max) => `${Math.max(0, Math.round((value / max) * 100))}%`;
  const hpState = (value, max) => value / max <= 0.2 ? "critical" : value / max <= 0.5 ? "warning" : "healthy";
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battle.log.length]);
  useEffect(() => setMenu("main"), [battle.turn]);
  const selectMove = (move) => { setMenu("main"); onMove(move); };
  const selectPokemon = (index) => { setMenu("main"); onSwitch(index); };
  const renderMoveMenu = () => <div className="classic-move-menu"><div className="move-menu-title">Escolha um golpe</div><div className="classic-move-grid">{playerPokemon.moves.map((move) => <button key={move.id || move.name} onClick={() => selectMove(move)}><MoveArtwork move={move} /><span className="move-button-copy"><strong>{moveLabel(move)}</strong><small>{moveTypeNames[move.type] || move.type} · {categoryNames[move.category]} · PP {move.pp || "—"}</small></span></button>)}</div><button className="classic-back" onClick={() => setMenu("main")}>VOLTAR</button></div>;
  const renderPokemonMenu = () => <div className="classic-pokemon-menu"><div className="move-menu-title">Escolha um Pokémon <small>Trocas disponíveis: {battle.playerSwitchTokens}</small></div><div className="classic-pokemon-grid">{battle.player.team.map((pokemon, index) => <button key={pokemon.id} disabled={battle.playerSwitchTokens < 1 || index === battle.playerIndex || battle.faintedPlayer.includes(index)} onClick={() => selectPokemon(index)}><img src={pokemon.image} alt="" /><span>{pokemon.name}</span><small>{index === battle.playerIndex ? "EM CAMPO" : battle.faintedPlayer.includes(index) ? "DESMAIADO" : battle.playerSwitchTokens < 1 ? "AGUARDE 2 KOs" : "DISPONÍVEL"}</small></button>)}</div><button className="classic-back" onClick={() => setMenu("main")}>VOLTAR</button></div>;
  const controls = battle.review
    ? <div className="classic-command"><div className="classic-prompt">Revisão automática: as duas IAs estão batalhando...</div></div>
    : <>{menu === "main" && <div className="classic-command"><div className="classic-prompt">{battle.resolving ? "Aguarde o resultado..." : `O que ${playerPokemon.name} fará?`}</div><button disabled={battle.resolving} onClick={() => setMenu("fight")}>FIGHT</button><button disabled={battle.resolving} onClick={() => setMenu("pokemon")}>POKÉMON</button></div>}{menu === "fight" && renderMoveMenu()}{menu === "pokemon" && renderPokemonMenu()}{menu !== "pokemon" && <div className="classic-switch-row"><strong>Switch · {battle.playerSwitchTokens} disponível(is)</strong><div>{battle.player.team.map((pokemon, index) => <button key={pokemon.id} disabled={battle.resolving || battle.playerSwitchTokens < 1 || index === battle.playerIndex || battle.faintedPlayer.includes(index)} onClick={() => selectPokemon(index)}><img src={pokemon.image} alt="" /><span>{pokemon.name}</span></button>)}</div></div>}</>;
  return <div className="battle-arena"><div className="battle-header"><span>{battle.player.name}<TeamIndicators team={battle.player.team} fainted={battle.faintedPlayer} current={battle.playerIndex} /></span><strong>VS</strong><span><TeamIndicators team={battle.enemy.team} fainted={battle.faintedEnemy} current={battle.enemyIndex} />{battle.enemy.name}</span></div><div className="battle-layout"><div className="battle-left"><div className="battle-field"><div className={`battle-side enemy-side ${battle.pendingReplacement?.side === "enemy" ? "fainted-side" : ""}`}><div className="battle-status"><strong>{enemyPokemon.name}</strong><StatusDisplay status={battle.enemyStatuses[ battle.enemyIndex ]} /><span>Lv {enemyPokemon.level || 100}</span><span>HP {battle.enemyHp}/{enemyMaxHp}</span><div className="hp-track"><i className={hpState(battle.enemyHp, enemyMaxHp)} style={{ width: hpPercent(battle.enemyHp, enemyMaxHp) }} /></div><BoostDisplay boosts={battle.enemyBoosts[ battle.enemyIndex ]} /></div><BattleSprite pokemon={enemyPokemon} enemy /></div><div className={`battle-side player-side ${battle.pendingReplacement?.side === "player" ? "fainted-side" : ""}`}><BattleSprite pokemon={playerPokemon} /><div className="battle-status"><strong>{playerPokemon.name}</strong><StatusDisplay status={battle.playerStatuses[ battle.playerIndex ]} /><span>Lv {playerPokemon.level || 100}</span><span>HP {battle.playerHp}/{playerMaxHp}</span><div className="hp-track"><i className={hpState(battle.playerHp, playerMaxHp)} style={{ width: hpPercent(battle.playerHp, playerMaxHp) }} /></div><BoostDisplay boosts={battle.playerBoosts[ battle.playerIndex ]} /></div></div>{(battle.animations || []).map((animation, index) => <div className={`battle-fx ${animation.side} type-${animation.type}`} style={{ animationDelay: `${index * 380}ms` }} key={animation.id}>{animation.asset ? <img src={animation.asset} alt="" /> : <span>{animation.symbol}</span>}</div>)}</div><div className="classic-controls">{controls}</div></div><aside className="battle-log-side"><div className="trainer-rail"><div><img src={showdownTrainerSprite(battle.enemy.trainerSprite)} alt="" /><small>{battle.enemy.name}</small></div><div><img src={showdownTrainerSprite(battle.player.trainerSprite)} alt="" /><small>{battle.player.name}</small></div></div><div className="battle-log" ref={logRef}>{battle.log.map((line, index) => <p className={line.startsWith("---") ? "turn-divider" : ""} key={`${line}-${index}`}>{line}</p>)}</div></aside></div></div>;
}

function TournamentMatch({ match, onBattle, reviewMode, onReview }) {
  const trainer = (candidate) => <div className={`trainer ${match.winner?.id === candidate.id ? "winner" : ""}`}><div className="trainer-heading"><strong>{candidate.name}{candidate.isUser ? " (você)" : ""}</strong><small>{candidate.team.length} Pokémon</small></div><div className="fighter-list">{candidate.team.map((pokemon) => <div key={pokemon.id}><img src={pokemon.image} alt="" /><span>{pokemon.name}<small>{pokemon.moves.slice(0, 4).map(moveLabel).join(", ")}</small></span></div>)}</div></div>;
  return <article className="tournament-match">{trainer(match.a)}<div className="versus">VS</div>{trainer(match.b)}{match.winner ? <div className="match-result">Vencedor: {match.winner.name}</div> : (match.a.isUser || match.b.isUser) ? reviewMode ? <div className="match-result">Luta do jogador — indisponível no review</div> : <button className="match-battle-button" onClick={() => onBattle(match)}>Batalhar</button> : reviewMode && <button className="match-battle-button" onClick={() => onReview(match)}>Revisar luta</button>}</article>;
}

function EmptyPage({ text }) { return <div className="empty-page"><span>✦</span><p>{text}</p></div>; }

function BottomNav({ page, setPage }) { return <nav className="bottom-nav"><button className={page === "team" ? "active" : ""} onClick={() => setPage("team")}><span>◈</span><small>Team Builder</small></button><button className={page === "moves" ? "active" : ""} onClick={() => setPage("moves")}><span>✦</span><small>Movimentos</small></button><button className={page === "battles" ? "active" : ""} onClick={() => setPage("battles")}><span>⚔</span><small>Batalhas</small></button></nav>; }

function TeamSlot({ pokemon, onClick }) {
  return (
    <button
      className={`team-slot ${pokemon ? "filled" : ""}`}
      onClick={onClick}
      disabled={!pokemon}
    >
      {pokemon ? (
        <>
          <img src={pokemon.image} alt={pokemon.name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackPokemonSprite(pokemon.id); }} />
          <span>
            {pokemon.name}
            <small><TypeSprites types={pokemon.types} /></small>
          </span>
        </>
      ) : (
        <>
          <div className="egg">
            <i />
          </div>
          <span>???</span>
        </>
      )}
    </button>
  );
}

function TeamAnalysis({ team }) {
  if (!team.length)
    return (
      <div className="analysis">
        Selecione Pokémon para analisar sua equipe.
      </div>
    );
  const icons = {
    Normal: "◉",
    Fire: "✹",
    Water: "♦",
    Electric: "ϟ",
    Grass: "♣",
    Ice: "❄",
    Fighting: "✚",
    Poison: "♟",
    Ground: "◆",
    Flying: "◢",
    Psychic: "●",
    Bug: "♣",
    Rock: "⬟",
    Ghost: "♣",
    Dragon: "♢",
    Dark: "●",
    Steel: "⬢",
    Fairy: "✦",
  };
  return (
    <div className="analysis">
      <div className="analysis-heading">Team Defense</div>
      <div className="defense-grid">
        {allTypes.map((type) => {
          const advantages = team.filter((pokemon) =>
            pokemon.types.some((attack) =>
              typeAdvantages[attack]?.includes(type),
            ),
          );
          const weaknesses = team.filter((pokemon) =>
            pokemon.types.some((defense) =>
              typeAdvantages[type]?.includes(defense),
            ),
          );
          const state =
            advantages.length === 0 && weaknesses.length === 0
              ? "neutral"
              : advantages.length >= weaknesses.length
                ? "covered"
                : "weak";
          const bars = [
            ...advantages.map((pokemon) => (
              <i className="advantage-bar" key={`a-${pokemon.id}`} />
            )),
            ...weaknesses.map((pokemon) => (
              <i className="weakness-bar" key={`w-${pokemon.id}`} />
            )),
          ];
          while (bars.length < 6) bars.push(<i key={`n-${bars.length}`} />);
          return (
            <div
              className={`defense-type ${state}`}
              key={type}
              title={`${typeNames[type]}: ${advantages.length} vantagem(ns) e ${weaknesses.length} fraqueza(s)`}
            >
              <div className="type-orb">{icons[type]}</div>
              <div className="defense-bars">{bars}</div>
              <small>{typeNames[type]}</small>
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span>
          <i className="legend-blue" /> Vantagem
        </span>
        <span>
          <i className="legend-red" /> Fraqueza
        </span>
        <span>
          <i className="legend-gray" /> Neutro
        </span>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
