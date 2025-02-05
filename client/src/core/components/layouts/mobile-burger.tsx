import { Button } from "../ui/button"
import { useSidebar } from "../ui/sidebar"
import Burger from "@/core/components/icons/Burger"

const MobileBurger = () => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button asChild variant="ghost" data-sidebar="trigger" size="icon" onClick={toggleSidebar} className="h-6 w-6 rounded-none sm:hidden block">
      <Burger />
    </Button>
  )
}

export default MobileBurger
