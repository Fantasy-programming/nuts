import { Button } from "../ui/button";
import { useSidebar } from "../ui/sidebar";
import Burger from "@/core/assets/icons/Burger";

const MobileBurger = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button asChild variant="ghost" data-sidebar="trigger" size="icon" onClick={toggleSidebar} className="block h-6 w-6 rounded-none sm:hidden">
      <Burger />
    </Button>
  );
};

export default MobileBurger;
