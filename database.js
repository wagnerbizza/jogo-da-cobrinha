// Importa a instância do banco de dados configurada
import { database } from "./firebase-config.js";
// Importa funções do Realtime Database do Firebase
import { ref, push, set, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Salva uma nova pontuação no banco de dados Firebase
export async function saveScore(name, score) {
  try {
    // Referência do nó 'ranking' no banco
    const rankingRef = ref(database, 'ranking');
    // Cria um novo nó único para o registro
    const newScoreRef = push(rankingRef);
    // Grava o nome e a pontuação no nó criado
    await set(newScoreRef, {
      name: name,
      score: score,
      timestamp: Date.now()
    });
    return true;
  } catch (error) {
    console.error("Erro ao salvar pontuação no Firebase:", error);
    return false;
  }
}

// Busca as 10 melhores pontuações salvas no banco
export async function getTopScores() {
  try {
    const rankingRef = ref(database, 'ranking');
    // Consulta ordenando por 'score' e limitando aos 10 maiores
    const topQuery = query(rankingRef, orderByChild('score'), limitToLast(10));
    const snapshot = await get(topQuery);

    const scores = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        scores.push(childSnapshot.val());
      });
      // Inverte o array para que o maior valor fique em primeiro lugar
      scores.reverse();
    }
    return scores;
  } catch (error) {
    console.error("Erro ao buscar o ranking do Firebase:", error);
    return [];
  }
}