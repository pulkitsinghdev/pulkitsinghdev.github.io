import PulkitPortfolio from "./components/portfolio/PulkitPortfolio";
import FloatingMusicPlayer from "./components/FloatingMusicPlayer";
import PortfolioIntro from "./components/PortfolioIntro";

export default function App() {
  return (
    <>
      <PortfolioIntro />
      <PulkitPortfolio
        name="Pulkit Singh"
        role="Open Source & Community Builder · Speaker · Technical Writer"
        title="PULKIT"
        year="2026"
        location="India"
        docLabel="EARTH-928 // 2099 FIELD ARCHIVE"
        portrait=""
        portraitVideo="/media/ascii-art-21st.webm"
        inkTrail
        colors={{
          paper: "#E8EEF6",
          night: "#071525",
          ink: "#0A1A30",
          pen: "#F0183C",
          blue: "#1769AA",
        }}
        sectionTitles={{
          skills: "The toolkit.",
          projects: "Selected builds.",
          facts: "Off the keyboard.",
          talks: "On stage & in the room.",
          writing: "Writing & media.",
          experience: "Experience & Community.",
        }}
      />

      <FloatingMusicPlayer
        src="/audio/spiderman-2099-score.mp3"
        title="MIGUEL O'HARA // 2099"
        subtitle="ACROSS THE SPIDER-VERSE · ORIGINAL SCORE"
      />
    </>
  );
}
