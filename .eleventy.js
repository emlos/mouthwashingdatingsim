const faviconsPlugin = require("eleventy-plugin-gen-favicons");

const simpleGit = require("simple-git");
const config = require("./src/_data/config");
const git = simpleGit({ multiLine: true });



const outputDir =
  process.env.MOUTHSIM_ENV.toLowerCase() == "deploy" ? "public" : "local";

async function gitCommitMessagesShortcode() {
  var content = "";

  const latest = await git.log({});

  latest.all.forEach((commit) => {
    content =
      content +
      `<li class="git-commit"><div class="git-date"><b>${moment(
        new Date(commit.date)
      ).format("DD-MM-YYYY HH:mm")}</b> - </div><div class="git-message">${
        commit.message
      }</div></li>\n`;
    //console.log(commit)
  });

  return content;
}

function capitalizeWords(str) {
    return str.replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });
  }

module.exports = function (eleventyConfig) {

  
  eleventyConfig.addPassthroughCopy("./src/css/");
  eleventyConfig.addWatchTarget("./src/css/");

  eleventyConfig.addPassthroughCopy("./src/images/**/*");

  eleventyConfig.addPassthroughCopy({ "./src/favicons": "/" }); //favicons remap to root
  eleventyConfig.addPassthroughCopy("./src/scripts/*.js");
  eleventyConfig.addPassthroughCopy("./src/fonts/");

  //shortcodes

  eleventyConfig.addNunjucksAsyncShortcode(
    "commitMessages",
    gitCommitMessagesShortcode
  );

  //filters
  eleventyConfig.addNunjucksFilter("keys", (object) =>  Object.keys(object));
  eleventyConfig.addNunjucksFilter("capitalize_all", capitalizeWords);
  

  //plugins

  eleventyConfig.addPlugin(faviconsPlugin, { outputDir: "./" + outputDir });

  return {
    pathPrefix: '/' + config.githubPrefix + '/',
    dir: {
      input: "src",
      output: outputDir,
      
    }
  };
};
