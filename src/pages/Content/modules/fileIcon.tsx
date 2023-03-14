import {
  DocumentIcon,
  FolderIcon,
  LinkIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid';
import { File, SyncKind } from '@operandinc/sdk';
import React from 'react';
import { AiFillFilePdf } from 'react-icons/ai';
import { BsHeadphones, BsYoutube } from 'react-icons/bs';
import { CgLinear } from 'react-icons/cg';
import {
  FaBrain,
  FaDiscord,
  FaGithub,
  FaRss,
  FaSitemap,
  FaSlack,
} from 'react-icons/fa';
import { RiChatVoiceLine } from 'react-icons/ri';
import { SiNotion } from 'react-icons/si';
export const FileIcon: React.FC<{
  file: File;
}> = ({ file }) => {
  const iconClass = 'w-4 h-4';
  const ext = file.name.split('.').pop();
  if (!file.sizeBytes) {
    switch (file.sync?.kind) {
      case SyncKind.SITEMAP:
        return <FaSitemap className={iconClass} />;
      case SyncKind.RSS:
        return <FaRss className={iconClass} />;
      case SyncKind.DISCORD:
        return <FaDiscord className={iconClass} />;
      case SyncKind.GITHUB_REPOSITORY:
        return <FaGithub className={iconClass} />;
      case SyncKind.SLACK:
        return <FaSlack className={iconClass} />;
      case SyncKind.LINEAR:
        return <CgLinear className={iconClass} />;
      case SyncKind.NOTION:
        return <SiNotion className={iconClass} />;
      case SyncKind.MEETING_BOT:
        return <RiChatVoiceLine className={iconClass} />;
      default:
        if (file.sync) {
          // Temporary fallback until we get more icons.
          return <FaBrain className={iconClass} />;
        }
        return <FolderIcon className={iconClass} />;
    }
  }

  switch (ext) {
    case 'pdf':
      return <AiFillFilePdf className={iconClass} />;
    case 'md':
    case 'markdown':
      return <PencilSquareIcon className={iconClass} />;
    case 'html':
    case 'htm':
      return <LinkIcon className={iconClass} />;
    case 'mp3':
    case 'wav':
    case 'ogg':
      return <BsHeadphones className={iconClass} />;
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'wmv':
    case 'flv':
    case 'mkv':
      return <BsYoutube className={iconClass} />;
    case 'rss':
      return <FaRss className={iconClass} />;
    case 'sitemap':
      return <FaSitemap className={iconClass} />;
    default:
      return <DocumentIcon className={iconClass} />;
  }
};
