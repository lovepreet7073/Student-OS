interface StepHeadingProps {
  title: string;
  description: string;
}

export function StepHeading({ title, description }: StepHeadingProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-balance text-[26px] font-extrabold leading-[1.15] tracking-tight sm:text-[30px]">
        {title}
      </h1>
      <p className="text-pretty text-[15.5px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
