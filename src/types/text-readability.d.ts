declare module "text-readability" {
  const readability: {
    fleschKincaidGrade(text: string): number;
  };

  export default readability;
}
