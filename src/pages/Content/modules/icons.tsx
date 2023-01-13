import * as React from 'react';

import { AiFillGithub, AiOutlineSlack } from 'react-icons/ai';
import { CgLinear } from 'react-icons/cg';
import { FaDiscord } from 'react-icons/fa';
import { RxNotionLogo } from 'react-icons/rx';
export type IconProps = {
  className?: string;
};

export const Notion: React.FC<IconProps> = ({ className }) => {
  return <RxNotionLogo className={className || ''} />;
};

export const Discord: React.FC<IconProps> = ({ className }) => {
  return <FaDiscord className={className || ''} />;
};

export const Slack: React.FC<IconProps> = ({ className }) => {
  return <AiOutlineSlack className={className || ''} />;
};

export const Linear: React.FC<IconProps> = ({ className }) => {
  return <CgLinear className={className || ''} />;
};

export const Github: React.FC<IconProps> = ({ className }) => {
  return <AiFillGithub className={className || ''} />;
};
