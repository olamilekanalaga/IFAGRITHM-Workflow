import InternalWorkspace from "@/components/internal-workspace";
import { identityDemo } from "@/lib/identity-demo";
export default function Page() {
  return <InternalWorkspace admin demonstration={identityDemo(true)} />;
}
