export enum Colors {
  White = '--pf-t--color--white',
  Black900 = '--pf-t--color--gray--90',
  Black600 = '--pf-t--color--gray--60',
  Black500 = '--pf-t--color--gray--50',
  Black400 = '--pf-t--color--gray--40',
  Black100 = '--pf-t--color--gray--10',
  Green500 = '--pf-t--color--green--50',
  Blue400 = '--pf-t--color--blue--40',
  Purple500 = '--pf-t--color--purple--50',
  Cyan300 = '--pf-t--color--cyan--30',
  Orange200 = '--pf-t--color--orange--20',
  Red200 = '--pf-t--color--red--20'
}

export enum VarColors {
  White = `var(${Colors.White})`,
  Black100 = `var(${Colors.Black100})`,
  Black400 = `var(${Colors.Black400})`,
  Black500 = `var(${Colors.Black500})`,
  Black600 = `var(${Colors.Black600})`,
  Black900 = `var(${Colors.Black900})`,
  Green500 = `var(${Colors.Green500})`,
  Blue400 = `var(${Colors.Blue400})`
}

export enum HexColors {
  White = '#FFFFFF',
  Blue200 = '#73BCF7',
  Blue400 = '#0066CC',
  Black100 = '#F0F0F0',
  Black400 = '#B8BBBE',
  Black300 = '#D2D2d2',
  Black500 = '#8A8D90',
  Black600 = '#6A6E73',
  Black800 = '#3C3F42',
  Black900 = '#151515'
}
