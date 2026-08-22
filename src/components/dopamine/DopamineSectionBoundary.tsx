import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  label: string;
}

interface State {
  hasError: boolean;
}

export class DopamineSectionBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[OUTSTAND] Dopamine module failed: ${this.props.label}`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-[2rem] border border-white/10 bg-[#0a0f1a]/70 p-6 shadow-2xl sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Module paused</p>
              <h2 className="mt-1 text-lg font-black text-white">{this.props.label}</h2>
              <p className="mt-1 text-sm text-slate-500">This module was isolated so the rest of your momentum page stays usable.</p>
            </div>
            <button type="button" onClick={() => this.setState({ hasError: false })} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.08]">Retry</button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
