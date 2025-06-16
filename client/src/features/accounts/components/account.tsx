import { useEffect, useState, useMemo } from "react";
import { Button } from "@/core/components/ui/button";
import { AccountWTrend, AccountUpdate, GroupedAccount } from "../services/account.types";

import {
  CreditCard,
  Wallet,
  TrendingUp,
  PiggyBank,
  Building,
  ChevronRight,
  ChevronDown,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar"
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { timeAgo, findAccountByIdFromGroups } from "./account.utils";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuContent, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import EditAccountModal from "./account.edit-modal"
import DeleteAccountDialog from "./account.delete-dialog"
import { useBrandImage } from "../hooks/useBrand";
import { config } from "@/lib/env"

interface SortedInterfaceGroup {
  type: "group",
  group: GroupedAccount,
}

interface SortedInterfaceAccount {
  type: "account",
  account: AccountWTrend,
  groupId: string,
}

interface MiniChartInterface {
  date: Date, balance: number
}


// Mini chart component using Recharts
function MiniChart({ data }: { data: MiniChartInterface[] }) {

  // If no data is provided, return empty chart
  if (!data || data.length === 0) {
    return <div className="h-8 w-20" />
  }

  // Format data for Recharts
  const chartData = data.map((value) => ({ value: value.balance }))

  const trend = data[data.length - 1].balance - data[0].balance
  const strokeColor = trend >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)" // emerald-500 or red-500

  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`gradient-${trend >= 0 ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#gradient-${trend >= 0 ? "up" : "down"})`}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HorizontalAccountCard({
  account,
  onEdit,
  onDelete,
  groupId,
}: {
  account: AccountWTrend
  onEdit: () => void
  onDelete: () => void
  groupId: string
}) {

  const { imageUrl } = useBrandImage(account.meta.institution_name || "", config.VITE_BRANDFETCH_CLIENTID);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: account.id,
    data: {
      type: "account",
      account,
      groupId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "checking":
        return <Building className="h-5 w-5 text-muted-foreground" />
      case "savings":
        return <PiggyBank className="h-5 w-5 text-muted-foreground" />
      case "investment":
        return <TrendingUp className="h-5 w-5 text-muted-foreground" />
      case "cash":
        return <Wallet className="h-5 w-5 text-muted-foreground" />
      default:
        return <CreditCard className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-card relative border-b last:border-b-0 transition-colors ${isDragging ? "bg-muted shadow-lg rounded-lg z-10" : "hover:bg-muted/30"
        }`}
    >
      {/* Grid layout for consistent column alignment - responsive for mobile */}
      <div className="grid grid-cols-12 items-center gap-2 sm:gap-4 p-3 sm:p-4">
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Account info - col span 6 on mobile, 5 on desktop */}
        <div className="col-span-6 sm:col-span-5 flex items-center gap-2 sm:gap-3">
          {account?.meta?.institution_name ? (
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0">
              <AvatarImage src={imageUrl || "/placeholder.svg"} alt={account?.meta?.institution_name} />
              <AvatarFallback className="rounded-full bg-primary/10 text-primary text-xs sm:text-sm">
                {account?.meta?.institution_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border bg-muted flex items-center justify-center flex-shrink-0">
              {getAccountIcon(account.type)}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-medium truncate text-sm sm:text-base">{account.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{account.type}</p>
          </div>
        </div>

        {/* Mini chart - hidden on mobile, col span 3 on desktop */}
        <div className="col-span-3 hidden md:block">
          <MiniChart data={account.balance_timeseries || []} />
        </div>

        {/* Balance and trend - col span 5 on mobile, 3 on desktop */}
        <div className="col-span-5 sm:col-span-3 flex flex-col items-end">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-semibold text-sm sm:text-base">
              ${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{timeAgo(account.updated_at)}</p>
        </div>

        {/* Action button - col span 1 */}
        <div className="col-span-1 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}



export function DraggableAccountGroups({
  initialAccounts,
  onEdit,
  onDelete,
  period
}: {
  initialAccounts: GroupedAccount[]
  onEdit: AccountUpdate
  onDelete: (id: string) => void
  period?: string
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AccountWTrend | null>(null)

  const [groups, setGroups] = useState<GroupedAccount[]>(initialAccounts)
  const [activeItem, setActiveItem] = useState<SortedInterfaceAccount | SortedInterfaceGroup | null>(null)

  // For the sortable context
  const groupIds = useMemo(() => groups.map((group) => group.type), [groups])


  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Load saved order from localStorage on component mount
  useEffect(() => {
    const savedGroups = localStorage.getItem("accountGroups")
    if (savedGroups) {
      try {
        const savedOrder = JSON.parse(savedGroups);

        // --- CHANGE IS HERE ---

        // 1. Map over the saved order. This might create `undefined` entries if a group is gone.
        const reorderedGroupsWithPotentialGaps = savedOrder.map((groupId: string) => {
          // Find the group from the fresh initialAccounts data
          const group = initialAccounts.find((g) => g.type === groupId);

          // If group doesn't exist anymore, return null/undefined
          if (!group) {
            return null;
          }

          // Get saved account order for this group
          const savedAccounts = localStorage.getItem(`accounts-${groupId}`);
          if (savedAccounts) {
            const accountOrder = JSON.parse(savedAccounts);
            const reorderedAccounts = accountOrder
              .map((accountId: string) => group.accounts.find((a) => a.id === accountId))
              .filter(Boolean); // filter(Boolean) removes nulls/undefined

            const newAccounts = group.accounts.filter((a) => !accountOrder.includes(a.id));

            return {
              ...group,
              accounts: [...reorderedAccounts, ...newAccounts],
            };
          }

          return group; // Return group as-is if no saved account order
        });

        // 2. Filter out the null/undefined entries to get a clean list
        const reorderedGroups = reorderedGroupsWithPotentialGaps.filter(Boolean);

        // --- END OF CHANGE ---

        // Add any new groups that weren't in the saved order
        const existingGroupIds = reorderedGroups.map(g => g.type);
        const newGroups = initialAccounts.filter((g) => !existingGroupIds.includes(g.type));

        setGroups([...reorderedGroups, ...newGroups]);
      } catch (error) {
        console.error("Error loading saved account order:", error);
        setGroups(initialAccounts);
      }
    } else {
      setGroups(initialAccounts);
    }
  }, [initialAccounts])

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveItem(active.data.current as SortedInterfaceAccount | SortedInterfaceGroup)
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    // Handle group reordering
    if (active.data.current?.type === "group" && over.data.current?.type === "group") {
      const oldIndex = groups.findIndex((group) => group.type === active.id)
      const newIndex = groups.findIndex((group) => group.type === over.id)

      if (oldIndex !== newIndex) {
        const newGroups = arrayMove(groups, oldIndex, newIndex)
        setGroups(newGroups)

        // Save group order to localStorage
        const groupIds = newGroups.map((g) => g.type)
        localStorage.setItem("accountGroups", JSON.stringify(groupIds))
      }
    }

    // Handle account reordering within a group
    if (active.data.current?.type === "account" && over.data.current?.type === "account") {
      const activeGroupId = active.data.current.groupId
      const overGroupId = over.data.current.groupId

      // If moving within the same group
      if (activeGroupId === overGroupId) {
        const groupIndex = groups.findIndex((g) => g.type === activeGroupId)
        const accounts = [...groups[groupIndex].accounts]

        const oldIndex = accounts.findIndex((account) => account.id === active.id)
        const newIndex = accounts.findIndex((account) => account.id === over.id)

        if (oldIndex !== newIndex) {
          const newAccounts = arrayMove(accounts, oldIndex, newIndex)
          const newGroups = [...groups]
          newGroups[groupIndex] = {
            ...newGroups[groupIndex],
            accounts: newAccounts,
          }

          setGroups(newGroups)

          // Save account order to localStorage
          const accountIds = newAccounts.map((a) => a.id)
          localStorage.setItem(`accounts-${activeGroupId}`, JSON.stringify(accountIds))
        }
      }
      // If moving between groups (not implementing this for simplicity)
      // This would require updating account types and recalculating balances
    }

    setActiveItem(null)
  }


  const handleEditAccount = (id: string) => {
    const account = findAccountByIdFromGroups(initialAccounts, id)

    if (account) {
      setSelectedAccount(account)
      setIsEditModalOpen(true)
    }
  }

  const openDeleteDialog = (id: string) => {
    const account = findAccountByIdFromGroups(initialAccounts, id)

    if (account) {
      setSelectedAccount(account)
      setIsDeleteDialogOpen(true)
    }
  }


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
        <div>
          {groups.map((group, id) => (
            <AccountGroup key={`${group.type}_${id}`} group={group} onEdit={handleEditAccount} period={period} onDelete={openDeleteDialog} />
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay for visual feedback during dragging */}
      <DragOverlay adjustScale={true}>
        {activeItem?.type === "group" && activeItem.group && (
          <div className="border rounded-lg overflow-hidden mb-6 shadow-xl bg-white dark:bg-slate-900 opacity-80">
            <div className="flex items-center justify-between p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <h2 className="font-medium">{activeItem.group.type}</h2>
              </div>
              <div className="font-semibold">
                $
                {activeItem.group.total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        )}

        {activeItem?.type === "account" && activeItem.account && (
          <div className="flex items-center justify-between p-4 border rounded-lg shadow-lg bg-white dark:bg-slate-900 opacity-80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <h3 className="font-medium">{activeItem.account.name}</h3>
                <p className="text-sm text-muted-foreground">{activeItem.account.type}</p>
              </div>
            </div>
            <div className="font-semibold">
              $
              {activeItem.account.balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        )}
      </DragOverlay>

      {selectedAccount && (
        <EditAccountModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          account={selectedAccount}
          onUpdateAccount={onEdit}
        />
      )}

      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        account={selectedAccount}
        onDeleteAccount={onDelete}
      />
    </DndContext>
  )
}


export function AccountGroup({
  group,
  onEdit,
  onDelete,
  period
}: {
  group: GroupedAccount
  period?: string
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)


  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.type,
    data: {
      type: "group",
      group,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }


  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg overflow-hidden mb-6 ${isDragging ? "shadow-xl z-10" : ""}`}
    >
      <div className="group relative flex items-center justify-between p-4 bg-card/90">
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleExpanded} className="flex items-center gap-2 flex-grow text-left">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            <h2 className="font-medium">{group.type}</h2>
            {group.trend !== 0 && (
              <span
                className={group.trend > 0 ? "text-emerald-600" : "text-red-600"}
                style={{ fontSize: "0.9rem" }}
              >
                {group.trend > 0 ? "↑" : "↓"} ${Math.abs(group.trend).toFixed(2)} (
                {Math.abs((group.trend / group.total) * 100).toFixed(1)}%)
              </span>
            )}
            <span className="text-sm text-muted-foreground">{period}</span>
          </button>
        </div>
        <div className="font-semibold">
          ${group.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {isExpanded && (
        <div>
          <SortableContext items={group.accounts.map((account) => account.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y">
              {group.accounts.map((account) => (
                <HorizontalAccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => onEdit(account.id)}
                  onDelete={() => onDelete(account.id)}
                  groupId={group.type}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      )}
    </div>
  )
}
