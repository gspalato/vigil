import { useUser } from "@clerk/clerk-expo";

export default function Page() {
  const { user } = useUser();
}
