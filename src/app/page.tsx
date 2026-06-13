// Server Component shell. All interactivity lives in the client <RankrApp>,
// so only that subtree ships as client JS.

import RankrApp from "@/components/RankrApp";

export default function Home() {
  return <RankrApp />;
}
