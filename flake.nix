{
  description = "ES-only gray-matter";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    git-hooks = {
      url = "github:cachix/git-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];

      imports = [
        inputs.git-hooks.flakeModule
        inputs.treefmt-nix.flakeModule
      ];

      perSystem =
        { config, pkgs, ... }:
        {
          treefmt = {
            projectRootFile = "flake.nix";
            programs = {
              nixfmt.enable = true;
            };
            settings.formatter.oxfmt = {
              command = "${pkgs.oxfmt}/bin/oxfmt";
              includes = [
                "*.md"
                "*.yml"
                "*.yaml"
                "*.json"
                "*.jsonc"
                "*.ts"
                "*.tsx"
                "*.js"
                "*.jsx"
              ];
              excludes = [ "CHANGELOG.md" ];
            };
          };

          pre-commit = {
            check.enable = false;
            settings.hooks = {
              gitleaks = {
                enable = true;
                name = "gitleaks";
                entry = "${pkgs.gitleaks}/bin/gitleaks protect --staged --config .gitleaks.toml";
                language = "system";
                pass_filenames = false;
              };
              typos = {
                enable = true;
              };
              treefmt = {
                enable = true;
                package = config.treefmt.build.wrapper;
              };
              typecheck = {
                enable = true;
                name = "typecheck";
                entry = "pnpm run typecheck";
                language = "system";
                pass_filenames = false;
              };
              vitest = {
                enable = true;
                name = "vitest";
                entry = "pnpm run test run";
                language = "system";
                pass_filenames = false;
              };
              knip = {
                enable = true;
                name = "knip";
                entry = "pnpm run lint:knip";
                language = "system";
                pass_filenames = false;
              };
            };
          };

          devShells.default = pkgs.mkShellNoCC {
            buildInputs = with pkgs; [
              # runtime
              nodejs_24
              pnpm_10
              typescript-go

              # formatting and linting tools
              oxlint
              oxfmt

              # security
              gitleaks

              # spell checking
              typos
              typos-lsp
            ];

            shellHook = ''
              echo "gray-matter-es dev shell"

              # Install dependencies only if node_modules/.pnpm/lock.yaml is older than pnpm-lock.yaml
              if [ ! -f node_modules/.pnpm/lock.yaml ] || [ pnpm-lock.yaml -nt node_modules/.pnpm/lock.yaml ]; then
                echo "Installing dependencies..."
                pnpm install --frozen-lockfile
              fi

              # Install git hooks
              ${config.pre-commit.installationScript}
            '';
          };
        };
    };
}
