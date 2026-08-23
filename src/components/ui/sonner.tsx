import { Toaster as Sonner } from "sonner";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      closeButton
      richColors={false}
      duration={3800}
      toastOptions={{
        classNames: {
          toast:
            "group-[.toaster]:!w-[min(92vw,400px)] group-[.toaster]:!rounded-2xl group-[.toaster]:!border group-[.toaster]:!border-white/10 group-[.toaster]:!bg-slate-950/92 group-[.toaster]:!text-white group-[.toaster]:!shadow-[0_22px_70px_rgba(0,0,0,.45)] group-[.toaster]:!backdrop-blur-2xl group-[.toaster]:!px-4 group-[.toaster]:!py-3.5",
          title: "group-[.toast]:!text-sm group-[.toast]:!font-extrabold group-[.toast]:!text-white",
          description: "group-[.toast]:!mt-1 group-[.toast]:!text-xs group-[.toast]:!leading-5 group-[.toast]:!text-slate-400",
          icon: "group-[.toast]:!mr-2",
          success: "group-[.toast]:!border-emerald-300/15",
          error: "group-[.toast]:!border-rose-300/15",
          warning: "group-[.toast]:!border-amber-300/15",
          info: "group-[.toast]:!border-cyan-300/15",
          actionButton: "group-[.toast]:!rounded-lg group-[.toast]:!bg-cyan-300 group-[.toast]:!px-3 group-[.toast]:!py-1.5 group-[.toast]:!text-xs group-[.toast]:!font-extrabold group-[.toast]:!text-slate-950",
          cancelButton: "group-[.toast]:!rounded-lg group-[.toast]:!border group-[.toast]:!border-white/10 group-[.toast]:!bg-white/5 group-[.toast]:!text-slate-300",
          closeButton: "group-[.toast]:!border-white/10 group-[.toast]:!bg-white/5 group-[.toast]:!text-slate-400 hover:group-[.toast]:!bg-white/10 hover:group-[.toast]:!text-white",
        },
      }}
      icons={{
        success: <CircleCheck className="h-4 w-4 text-emerald-300" />,
        error: <CircleX className="h-4 w-4 text-rose-300" />,
        warning: <TriangleAlert className="h-4 w-4 text-amber-300" />,
        info: <Info className="h-4 w-4 text-cyan-300" />,
      }}
      {...props}
    />
  );
};

export { Toaster };
