interface BadgeProps {
  count: number
}

export default function Badge({ count }: BadgeProps) {
  if (count <= 0) return null
  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C89460] px-1 text-[10px] font-medium text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}
