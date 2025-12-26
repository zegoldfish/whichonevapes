// Quick test of canvas functionality
import { drawMatchupCanvas } from "@/lib/canvasMatchup";

const testCelebA = {
  id: "test1",
  name: "Test Celebrity A",
  vapesVotes: 5,
  doesNotVapeVotes: 2,
  elo: 1000,
  wins: 10,
  matches: 20,
  confirmedVaper: false,
  confirmedVaperYesVotes: 0,
  confirmedVaperNoVotes: 0,
  wikipediaPageId: "123",
  image: null,
  imgSrc: "https://via.placeholder.com/500x500?text=Celebrity+A",
};

const testCelebB = {
  id: "test2",
  name: "Test Celebrity B",
  vapesVotes: 3,
  doesNotVapeVotes: 4,
  elo: 980,
  wins: 8,
  matches: 18,
  confirmedVaper: false,
  confirmedVaperYesVotes: 0,
  confirmedVaperNoVotes: 0,
  wikipediaPageId: "456",
  image: null,
  imgSrc: "https://via.placeholder.com/500x500?text=Celebrity+B",
};

async function test() {
  try {
    console.log("Starting canvas test...");
    const blob = await drawMatchupCanvas(testCelebA, testCelebB, {
      includeNames: true,
      includeStats: true,
    });
    console.log("Canvas test succeeded! Blob size:", blob.size);
  } catch (err) {
    console.error("Canvas test failed:", err);
  }
}
