import ScoutWorkspace from "@/components/scout-workspace";
export default function Demo() {
  return (
    <>
      <div className="demo-banner">
        LOCAL DEMONSTRATION · No authenticated authorship or shared records ·{" "}
        <a href="/sign-in">Google sign-in</a>
      </div>
      <ScoutWorkspace />
    </>
  );
}
