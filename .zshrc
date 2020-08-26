export LANG=ja_JP.UTF-8
export EDITOR=vim
HISTFILE=$HOME/.zsh-history
HISTSIZE=100000
SAVEHIST=100000

export PGDATA=/usr/local/var/postgres
export PATH=/bin:/sbin:/usr/bin:/usr/local/sbin:/usr/local/bin:$PATH

### prompt
unsetopt promptcr
setopt prompt_subst
autoload -U colors; colors
autoload -Uz vcs_info

local HOSTNAME_COLOR=$'%{\e[38;5;190m%}'
local USERNAME_COLOR=$'%{\e[38;5;199m%}'
local PATH_COLOR=$'%{\e[38;5;61m%}'
local RUBY_COLOR=$'%{\e[38;5;31m%}'
local VCS_COLOR=$'%{\e[38;5;248m%}'

zstyle ':vcs_info:*' formats '[%b]'
zstyle ':vcs_info:*' actionformats '[%b] (%a)'

zstyle ':vcs_info:git:*' check-for-changes true
zstyle ':vcs_info:git:*' unstagedstr '¹'  # display ¹ if there are unstaged changes
zstyle ':vcs_info:git:*' stagedstr '²'    # display ² if there are staged changes
zstyle ':vcs_info:git:*' formats '[%b]%c%u'
zstyle ':vcs_info:git:*' actionformats '[%b|%a]%c%u'

precmd () {
    psvar=()
    vcs_info
    [[ -n "$vcs_info_msg_0_" ]] && psvar[1]="$vcs_info_msg_0_"
}

PROMPT=$'%{$fg[yellow]%}%n%{$fg[red]%}@$fg[green]%}%m %{$fg[cyan]%}%~ %1(v|%F{green}%1v%f|)\n%{$fg[green]%}%#%{$reset_color%} '

## brew caskで入れたアプリのインストール先を変更
export HOMEBREW_CASK_OPTS="--appdir=/Applications"

## rbenv
[[ -d ~/.rbenv  ]] && \
  export PATH=${HOME}/.rbenv/bin:${PATH} && \
  eval "$(rbenv init -)"

# zsh-completionsの設定
fpath=(/path/to/homebrew/share/zsh-completions $fpath)
autoload -U compinit
compinit

# 第1引数がディレクトリだと自動的に cd を補完
setopt auto_cd

## コアダンプサイズを制限
limit coredumpsize 102400

## 出力の文字列末尾に改行コードが無い場合でも表示
unsetopt promptcr

## 色を使う
setopt prompt_subst

## ビープを鳴らさない
setopt nobeep

## 内部コマンド jobs の出力をデフォルトで jobs -l にする
setopt long_list_jobs

## 補完候補一覧でファイルの種別をマーク表示
setopt list_types

## サスペンド中のプロセスと同じコマンド名を実行した場合はリジューム
setopt auto_resume

## 補完候補を一覧表示
setopt auto_list

## 直前と同じコマンドをヒストリに追加しない
setopt hist_ignore_dups

## cd 時に自動で push
setopt autopushd

## 同じディレクトリを pushd しない
setopt pushd_ignore_dups

## ファイル名で #, ~, ^ の 3 文字を正規表現として扱う
#setopt extended_glob

## TAB で順に補完候補を切り替える
setopt auto_menu

## zsh の開始, 終了時刻をヒストリファイルに書き込む
setopt extended_history

## =command を command のパス名に展開する
setopt equals

## --prefix=/usr などの = 以降も補完
setopt magic_equal_subst

## ヒストリを呼び出してから実行する間に一旦編集
setopt hist_verify

# ファイル名の展開で辞書順ではなく数値的にソート
setopt numeric_glob_sort

## 出力時8ビットを通す
setopt print_eight_bit

## ヒストリを共有
setopt share_history

## 補完候補のカーソル選択を有効に
zstyle ':completion:*:default' menu select=1

## 補完候補の色づけ
zstyle ':completion:*:default' list-colors ${(s.:.)LS_COLORS}

## ディレクトリ名だけで cd
setopt auto_cd

## カッコの対応などを自動的に補完
setopt auto_param_keys

## ディレクトリ名の補完で末尾の / を自動的に付加し、次の補完に備える
setopt auto_param_slash

## スペルチェック
#setopt correct

# ディレクトリ移動履歴保存
setopt auto_pushd

# CTRL-Wとかしたときに/とかで止まるやつ！
WORDCHARS='*?_-.[]~=&;!#$%^(){}<>'

# alias
source ~/.aliases

# do brew install rvm
# PATH=$PATH:$HOME/.rvm/bin # Add RVM to PATH for scripting

## http://d.hatena.ne.jp/hiboma/20120315/1331821642
## Ctrl + X Crtl + Pでコマンドラインをクリップボードに登録
pbcopy-buffer(){
    print -rn $BUFFER | pbcopy
    zle -M "pbcopy: ${BUFFER}"
}

zle -N pbcopy-buffer
bindkey '^x^p' pbcopy-buffer

# bindkey
bindkey '^P' history-beginning-search-backward
bindkey '^N' history-beginning-search-forward
bindkey '^X^F' forward-word
bindkey '^X^B' backward-word
bindkey '^R' history-incremental-pattern-search-backward
bindkey '^S' history-incremental-pattern-search-forward
#bindkey -e

# rbenv installでgccを使う
export PATH=$HOME/.rbenv/bin:$PATH
eval "$(rbenv init -)"
export CC=/usr/bin/gcc

### Added by the Heroku Toolbelt
export PATH="/usr/local/heroku/bin:$PATH"

# ImageMagickを使う
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig

# hubを使う
function git(){hub "$@"}

# gitのタブ補完
# zstyle ':completion:*:*:git:*' script ~/.zsh/completion/git-completion.bash
# fpath=(~/.zsh/completion $fpath)
source ~/.zsh/completion/git-completion.bash

# 何も入力されていない状態で Enter を打つだけで ls と git status が表示される
function do_enter() {
    if [ -n "$BUFFER" ]; then
        zle accept-line
        return 0
    fi
    echo
    ls
    # ↓おすすめ
    # ls_abbrev
    if [ "$(git rev-parse --is-inside-work-tree 2> /dev/null)" = 'true' ]; then
        echo
        echo -e "\e[0;33m--- git status ---\e[0m"
        git status -sb
    fi
    zle reset-prompt
    return 0
}
zle -N do_enter
bindkey '^m' do_enter

dict () { open dict:///"$@" ; }

export PATH=/usr/local/bin:$PATH

function current_branch() {
  ref=$(git symbolic-ref HEAD 2> /dev/null) || \
  ref=$(git rev-parse --short HEAD 2> /dev/null) || return
  echo ${ref#refs/heads/}
}

autoload -Uz zmv
alias zmv='noglob zmv -W'

# git today
git config --global alias.today "log --since=midnight --author='$(git config user.name)' --oneline"

# gemのdirectoryに移動
function cdgem() {
  local gem_name=$(bundle list | sed -e 's/^ *\* *//g' | peco | cut -d \  -f 1)
  if [ -n "$gem_name" ]; then
    local gem_dir=$(bundle show ${gem_name})
    echo "cd to ${gem_dir}"
    cd ${gem_dir}
  fi
}

# brew-file を使う
if [ -f $(brew --prefix)/etc/brew-wrap ];then
  source $(brew --prefix)/etc/brew-wrap
fi

# カレントディレクトリの変更で自動的にNode.jsのバージョンを変える
function chpwd_node_version() {
  if [ -e ".node-version" ]; then
    version=`cat .node-version`
    nodebrew use $version
  fi
}

autoload -Uz add-zsh-hook
add-zsh-hook chpwd chpwd_node_version

# node brew
export PATH=$HOME/.nodebrew/current/bin:$PATH

alias ls="ls -G -w"
export LSCOLORS=DxGxcxdxCxegedabagacad

# node_module ローカルで実行する時
if [ -d ${HOME}/node_modules/.bin ]; then
    export PATH=${PATH}:${HOME}/node_modules/.bin
fi