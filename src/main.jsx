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
const loadPokemonData = async (pokemonId) => {
  if (!pokemonDataCache.has(pokemonId)) {
    pokemonDataCache.set(pokemonId, fetch(`${apiBase}/pokemon/${pokemonId}`).then((response) => {
      if (!response.ok) throw new Error("Não foi possível carregar os dados do Pokémon.");
      return response.json();
    }));
  }
  return pokemonDataCache.get(pokemonId);
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
    category: move.damage_class.name,
    statChanges: move.stat_changes?.map(({ stat, change }) => ({ stat: stat.name, change })) || [],
    effect: getEffect(move),
  };
};

const trainerNames = ["Rafael", "Bianca", "Caio", "Lívia", "Diego", "Maya", "Theo", "Helena", "Bruno", "Nina", "Enzo", "Clara"];
const trainerSprites = ["acetrainer-gen1", "acetrainerf-gen1", "beauty-gen1", "bugcatcher-gen1", "fisher-gen1", "hiker-gen1", "lass-gen1", "schoolboy-gen4", "scientist-gen1", "swimmer-gen1", "youngster-gen1"];
const randomItems = (items, amount) => [...items].sort(() => Math.random() - 0.5).slice(0, amount);
const moveLabel = (move) => move.name.replaceAll("-", " ");
const showdownPokemonName = (pokemon) => pokemon.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("♀", "-f").replace("♂", "-m").replace(/[’.' ]/g, "").replace("mr-mime", "mr-mime");
const showdownPokemonSprite = (pokemon) => `https://play.pokemonshowdown.com/sprites/ani/${showdownPokemonName(pokemon)}.gif`;
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

const createRandomOpponent = async (name, id, trainerSprite) => {
  const selectedPokemon = randomItems(pokemonList, 6);
  const team = await Promise.all(selectedPokemon.map(async (pokemon) => {
    const data = await loadPokemonData(pokemon.id);
    return { ...pokemon, level: 100, stats: getPokemonStats(data), moves: randomItems(data.moves.filter(({ version_group_details }) => version_group_details.some(({ move_learn_method }) => ["level-up", "machine", "egg", "tutor"].includes(move_learn_method.name))).map(({ move }) => move), 4) };
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
const getDamage = (attacker, move, defender, attackerBoosts = {}, defenderBoosts = {}) => {
  if (move.category === "status") return 0;
  const level = attacker.level || 50;
  const power = move.power || 40;
  const attackStat = getBattleStat(attacker, move.category === "special" ? "special-attack" : "attack");
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
  const [movesByPokemon, setMovesByPokemon] = useState({});
  const [chosenMoves, setChosenMoves] = useState({});
  const options = useMemo(
    () =>
      pokemonList.filter((pokemon) =>
        pokemon.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  const toggle = (pokemon) =>
    setTeam((current) =>
      current.some((item) => item.id === pokemon.id)
        ? current.filter((item) => item.id !== pokemon.id)
        : current.length < 6
          ? [...current, pokemon]
          : current,
    );
  const randomize = () =>
    setTeam([...pokemonList].sort(() => Math.random() - 0.5).slice(0, 6));

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="pokeball-logo">
          <span />
        </div>
        <h1>Pokémon Team Builder</h1>
        <div className="top-links"></div>
      </header>
      <div className={page === "team" ? "" : "page-hidden"}>
      <div className="intro">
        <p>
          Use esta ferramenta para planejar sua equipe para uma partida no jogo.
          Clique em um Pokémon abaixo para adicioná-lo à sua equipe e clique
          novamente para removê-lo. Divirta-se e compartilhe com seus amigos e
          vizinhos!
        </p>
      </div>
      <section className="panel team-panel">
        <h2>Meu time</h2>
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
        <div className="generation">Kanto Pokédex</div>
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
              <img src={pokemon.image} alt={pokemon.name} />
              <span>{showToggles ? pokemon.name : ""}</span>
              <small>{showToggles ? formatTypes(pokemon.types) : ""}</small>
            </button>
          ))}
        </div>
      </section>
      <footer>Pokémon Team Builder · Kanto region</footer>
      </div>
      {page === "moves" && <MovesPage team={team} movesByPokemon={movesByPokemon} setMovesByPokemon={setMovesByPokemon} chosenMoves={chosenMoves} setChosenMoves={setChosenMoves} />}
      {page === "battles" && <BattlesPage team={team} chosenMoves={chosenMoves} />}
      <BottomNav page={page} setPage={setPage} />
    </main>
  );
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

function BattlesPage({ team, chosenMoves }) {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeBattle, setActiveBattle] = useState(null);
  const [battleLoading, setBattleLoading] = useState(false);

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
      const opponents = await Promise.all(names.map((name, index) => createRandomOpponent(name, `opponent-${index}`, availableTrainerSprites[index + 1] || trainerSprites[index % trainerSprites.length])));
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
        battleApiSnapshot,
        turn: 0,
        animations: [],
        log: [`${playerPokemon.name} entrou na batalha contra ${enemyPokemon.name}!`],
        finished: false,
      });
    } catch (requestError) {
      setError(`Não foi possível carregar os golpes da batalha: ${requestError.message}`);
    } finally {
      setBattleLoading(false);
    }
  };

  const finishBattle = (winner) => {
    setTournament((current) => {
      if (!current) return current;
      const rounds = current.rounds.map((round, index) => index === current.currentRound ? round.map((match) => match.id === activeBattle.matchId ? { ...match, winner } : match) : round);
      return { ...current, rounds, eliminated: !winner.isUser && winner.id !== "user" };
    });
    setActiveBattle(null);
  };

  const playMove = (move) => {
    if (!activeBattle || activeBattle.finished) return;
    const playerPokemon = activeBattle.player.team[activeBattle.playerIndex];
    const enemyPokemon = activeBattle.enemy.team[activeBattle.enemyIndex];
    const enemyMove = randomItems(enemyPokemon.moves, 1)[0];
    const playerSpeed = getBattleStat(playerPokemon, "speed") * getStageMultiplier((activeBattle.playerBoosts[activeBattle.playerIndex] || {}).speed);
    const enemySpeed = getBattleStat(enemyPokemon, "speed") * getStageMultiplier((activeBattle.enemyBoosts[activeBattle.enemyIndex] || {}).speed);
    const actions = playerSpeed >= enemySpeed ? [{ side: "player", move }, { side: "enemy", move: enemyMove }] : [{ side: "enemy", move: enemyMove }, { side: "player", move }];
    let next = { ...activeBattle, turn: (activeBattle.turn || 0) + 1, animations: actions.map((action, index) => ({ id: `${activeBattle.turn}-${index}-${action.move.name}`, side: action.side, type: action.move.type, symbol: animationSymbols[action.move.type] || "✦" })), log: [...activeBattle.log, `--- Turno ${(activeBattle.turn || 0) + 1} ---`], playerBoosts: { ...activeBattle.playerBoosts }, enemyBoosts: { ...activeBattle.enemyBoosts } };

    for (const action of actions) {
      const attacker = action.side === "player" ? next.player.team[next.playerIndex] : next.enemy.team[next.enemyIndex];
      const defender = action.side === "player" ? next.enemy.team[next.enemyIndex] : next.player.team[next.playerIndex];
      const attackerIndex = action.side === "player" ? next.playerIndex : next.enemyIndex;
      const attackerBoosts = action.side === "player" ? (next.playerBoosts[attackerIndex] || {}) : (next.enemyBoosts[attackerIndex] || {});
      const defenderBoosts = action.side === "player" ? (next.enemyBoosts[next.enemyIndex] || {}) : (next.playerBoosts[next.playerIndex] || {});
      const multiplier = getTypeMultiplier(action.move.type, defender.types);
      const damage = getDamage(attacker, action.move, defender, attackerBoosts, defenderBoosts);
      const prefix = action.side === "player" ? "Você" : "Adversário";
      const boosts = applyStatChanges(attackerBoosts, action.move.statChanges);
      if (action.side === "player") next.playerBoosts[attackerIndex] = boosts;
      else next.enemyBoosts[attackerIndex] = boosts;
      next.log.push(`${prefix}: ${attacker.name} usou ${moveLabel(action.move)} e causou ${damage} de dano.`);
      next.log.push(`${getEffectivenessMessage(multiplier)}`);
      if (action.move.statChanges.length) next.log.push(`${attacker.name}: ${formatBoosts(boosts).join(", ") || "atributos alterados"}.`);
      if (action.side === "player") next.enemyHp = Math.max(0, next.enemyHp - damage);
      else next.playerHp = Math.max(0, next.playerHp - damage);
      const targetHp = action.side === "player" ? next.enemyHp : next.playerHp;
      if (targetHp === 0) {
        const targetIsEnemy = action.side === "player";
        next.log.push(`${defender.name} desmaiou!`);
        const fainted = targetIsEnemy ? [...next.faintedEnemy, next.enemyIndex] : [...next.faintedPlayer, next.playerIndex];
        const targetTeam = targetIsEnemy ? next.enemy.team : next.player.team;
        if (fainted.length === targetTeam.length) {
          finishBattle(targetIsEnemy ? next.player : next.enemy);
          return;
        }
        const nextIndex = getNextAvailableIndex(targetTeam, fainted);
        const nextPokemon = targetTeam[nextIndex];
        if (targetIsEnemy) {
          next.enemyIndex = nextIndex;
          next.enemyHp = getMaxHp(nextPokemon);
          next.faintedEnemy = fainted;
          next.enemyBoosts[nextIndex] = {};
        } else {
          next.playerIndex = nextIndex;
          next.playerHp = getMaxHp(nextPokemon);
          next.faintedPlayer = fainted;
          next.playerBoosts[nextIndex] = {};
        }
        next.log.push(`${nextPokemon.name} entrou na batalha!`);
        break;
      }
    }
    setActiveBattle(next);
  };

  const switchPokemon = (nextIndex) => {
    if (!activeBattle || nextIndex === activeBattle.playerIndex || activeBattle.faintedPlayer.includes(nextIndex)) return;
    const nextPokemon = activeBattle.player.team[nextIndex];
    const enemyPokemon = activeBattle.enemy.team[activeBattle.enemyIndex];
    const enemyMove = randomItems(enemyPokemon.moves, 1)[0];
    const enemyBoost = activeBattle.enemyBoosts[activeBattle.enemyIndex] || {};
    const damage = getDamage(enemyPokemon, enemyMove, nextPokemon, enemyBoost, activeBattle.playerBoosts[nextIndex] || {});
    const playerHp = Math.max(0, getMaxHp(nextPokemon) - damage);
    const enemyBoosts = { ...activeBattle.enemyBoosts, [activeBattle.enemyIndex]: applyStatChanges(enemyBoost, enemyMove.statChanges) };
    const log = [...activeBattle.log, `--- Turno ${(activeBattle.turn || 0) + 1} ---`, `Você trocou para ${nextPokemon.name}.`, `Adversário: ${enemyPokemon.name} usou ${moveLabel(enemyMove)} e causou ${damage} de dano.`, getEffectivenessMessage(getTypeMultiplier(enemyMove.type, nextPokemon.types))];
    const animations = [{ id: `${activeBattle.turn}-switch-${enemyMove.name}`, side: "enemy", type: enemyMove.type, symbol: animationSymbols[enemyMove.type] || "✦" }];
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
      setActiveBattle({ ...activeBattle, turn: (activeBattle.turn || 0) + 1, animations, playerIndex: fallbackIndex, playerHp: getMaxHp(fallbackPokemon), faintedPlayer, enemyBoosts, log: [...log, `${fallbackPokemon.name} entrou na batalha!`] });
      return;
    }
    setActiveBattle({ ...activeBattle, turn: (activeBattle.turn || 0) + 1, animations, playerIndex: nextIndex, playerHp, enemyBoosts, log });
  };

  const roundNames = ["Quartas de final", "Semifinais", "Grande final"];
  const currentMatches = tournament?.rounds[tournament.currentRound] || [];
  return <section className="subpage"><div className="subpage-heading"><span className="section-label">Arena</span><h2>Torneio Pokémon</h2><p>Batalhas por turnos inspiradas nos jogos oficiais: escolha golpes, acompanhe o HP, troque Pokémon e avance na chave.</p></div>{error && <div className="api-error">{error}</div>}{!team.length ? <EmptyPage text="Adicione Pokémon ao seu time antes de entrar no torneio." /> : <><div className="tournament-actions"><button className="battle-button" onClick={startTournament} disabled={loading || battleLoading}>{loading ? "Montando torneio..." : tournament ? "Novo torneio" : "Montar torneio"}</button>{tournament && !tournament.champion && !tournament.eliminated && <button className="secondary-button" onClick={simulateRound}>Simular lutas dos adversários</button>}</div>{battleLoading && <div className="loading-card">Carregando os golpes da batalha...</div>}{activeBattle && <BattleArena battle={activeBattle} onMove={playMove} onSwitch={switchPokemon} />}{tournament && !activeBattle && <><div className="round-title"><span>{tournament.champion ? "Torneio encerrado" : tournament.eliminated ? "Você foi eliminado" : roundNames[tournament.currentRound]}</span><small>{tournament.champion ? `Campeão: ${tournament.champion.name}` : `${currentMatches.length} batalha(s)`}</small></div><div className="tournament-grid">{currentMatches.map((match) => <TournamentMatch key={match.id} match={match} onBattle={beginBattle} />)}</div>{tournament.champion && <div className="champion-card">🏆 <strong>{tournament.champion.name} venceu o torneio!</strong><span>O campeão terminou com uma equipe de {tournament.champion.team.length} Pokémon.</span></div>}{tournament.eliminated && <div className="elimination-card">Seu time foi derrotado. Monte um novo torneio para tentar novamente.</div>}</>}</>}</section>;
}

function BoostDisplay({ boosts }) {
  const activeBoosts = formatBoosts(boosts);
  return activeBoosts.length ? <div className="boost-display">{activeBoosts.map((boost) => <span key={boost}>{boost}</span>)}</div> : null;
}

function StatsSummary({ pokemon }) {
  const stats = pokemon.stats || {};
  return <div className="stats-summary"><span>ATK {stats.attack || "—"}</span><span>DEF {stats.defense || "—"}</span><span>SpA {stats["special-attack"] || "—"}</span><span>SpD {stats["special-defense"] || "—"}</span><span>SPD {stats.speed || "—"}</span></div>;
}

function BattleSprite({ pokemon, enemy = false }) {
  const [fallback, setFallback] = useState(false);
  return <img className={`battle-sprite ${enemy ? "enemy-sprite" : ""}`} src={fallback ? pokemon.image : showdownPokemonSprite(pokemon)} onError={() => setFallback(true)} alt={pokemon.name} />;
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
  const renderMoveMenu = () => <div className="classic-move-menu"><div className="move-menu-title">Escolha um golpe</div><div className="classic-move-grid">{playerPokemon.moves.map((move) => <button key={move.id || move.name} onClick={() => selectMove(move)}><strong>{moveLabel(move)}</strong><small>{moveTypeNames[move.type] || move.type} · {categoryNames[move.category]} · PP {move.pp || "—"}</small></button>)}</div><button className="classic-back" onClick={() => setMenu("main")}>VOLTAR</button></div>;
  const renderPokemonMenu = () => <div className="classic-pokemon-menu"><div className="move-menu-title">Escolha um Pokémon</div><div className="classic-pokemon-grid">{battle.player.team.map((pokemon, index) => <button key={pokemon.id} disabled={index === battle.playerIndex || battle.faintedPlayer.includes(index)} onClick={() => selectPokemon(index)}><img src={pokemon.image} alt="" /><span>{pokemon.name}</span><small>{index === battle.playerIndex ? "EM CAMPO" : battle.faintedPlayer.includes(index) ? "DESMAIADO" : "DISPONÍVEL"}</small></button>)}</div><button className="classic-back" onClick={() => setMenu("main")}>VOLTAR</button></div>;
  return <div className="battle-arena"><div className="battle-header"><span>{battle.player.name}</span><strong>VS</strong><span>{battle.enemy.name}</span></div><div className="battle-layout"><div className="battle-left"><div className="battle-field"><div className="battle-side enemy-side"><div className="battle-status"><strong>{enemyPokemon.name}</strong><span>Lv {enemyPokemon.level || 100}</span><span>HP {battle.enemyHp}/{enemyMaxHp}</span><div className="hp-track"><i className={hpState(battle.enemyHp, enemyMaxHp)} style={{ width: hpPercent(battle.enemyHp, enemyMaxHp) }} /></div><BoostDisplay boosts={battle.enemyBoosts[ battle.enemyIndex ]} /></div><BattleSprite pokemon={enemyPokemon} enemy /></div><div className="battle-side player-side"><BattleSprite pokemon={playerPokemon} /><div className="battle-status"><strong>{playerPokemon.name}</strong><span>Lv {playerPokemon.level || 100}</span><span>HP {battle.playerHp}/{playerMaxHp}</span><div className="hp-track"><i className={hpState(battle.playerHp, playerMaxHp)} style={{ width: hpPercent(battle.playerHp, playerMaxHp) }} /></div><BoostDisplay boosts={battle.playerBoosts[ battle.playerIndex ]} /></div></div>{(battle.animations || []).map((animation, index) => <div className={`battle-fx ${animation.side} type-${animation.type}`} style={{ animationDelay: `${index * 380}ms` }} key={animation.id}><span>{animation.symbol}</span></div>)}</div><div className="classic-controls">{menu === "main" && <div className="classic-command"><div className="classic-prompt">O que {playerPokemon.name} fará?</div><button onClick={() => setMenu("fight")}>FIGHT</button><button onClick={() => setMenu("pokemon")}>POKÉMON</button></div>}{menu === "fight" && renderMoveMenu()}{menu === "pokemon" && renderPokemonMenu()}{menu !== "pokemon" && <div className="classic-switch-row"><strong>Switch</strong><div>{battle.player.team.map((pokemon, index) => <button key={pokemon.id} disabled={index === battle.playerIndex || battle.faintedPlayer.includes(index)} onClick={() => selectPokemon(index)}><img src={pokemon.image} alt="" /><span>{pokemon.name}</span></button>)}</div></div>}</div></div><aside className="battle-log-side"><div className="trainer-rail"><div><img src={showdownTrainerSprite(battle.enemy.trainerSprite)} alt="" /><small>{battle.enemy.name}</small></div><div><img src={showdownTrainerSprite(battle.player.trainerSprite)} alt="" /><small>{battle.player.name}</small></div></div><div className="battle-log" ref={logRef}>{battle.log.map((line, index) => <p className={line.startsWith("---") ? "turn-divider" : ""} key={`${line}-${index}`}>{line}</p>)}</div></aside></div></div>;
}

function TournamentMatch({ match, onBattle }) {
  const trainer = (candidate) => <div className={`trainer ${match.winner?.id === candidate.id ? "winner" : ""}`}><div className="trainer-heading"><strong>{candidate.name}{candidate.isUser ? " (você)" : ""}</strong><small>{candidate.team.length} Pokémon</small></div><div className="fighter-list">{candidate.team.map((pokemon) => <div key={pokemon.id}><img src={pokemon.image} alt="" /><span>{pokemon.name}<small>{pokemon.moves.slice(0, 4).map(moveLabel).join(", ")}</small></span></div>)}</div></div>;
  return <article className="tournament-match">{trainer(match.a)}<div className="versus">VS</div>{trainer(match.b)}{match.winner ? <div className="match-result">Vencedor: {match.winner.name}</div> : (match.a.isUser || match.b.isUser) && <button className="match-battle-button" onClick={() => onBattle(match)}>Batalhar</button>}</article>;
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
          <img src={pokemon.image} alt={pokemon.name} />
          <span>
            {pokemon.name}
            <small>{formatTypes(pokemon.types)}</small>
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
